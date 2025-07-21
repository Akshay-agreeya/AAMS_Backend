const express = require('express');
const multer = require('multer');
const AdmZip = require('adm-zip');
const { getConnectionPool, sql } = require('../config/db');
const fs = require('fs');
const path = require('path');
const { extractFiles } = require('../utils/extractFiles');
const { extractMobileFiles } = require('../utils/extractMobileFiles');
const { SuccessReturnHandler } = require('../middlewares/responseHandler');
const { STATUS_CODES } = require('../utils/errorCodes');
const { SUCCESS_MESSAGES } = require('../utils/responseMessages');
const { verifyJwt } = require('../middlewares/auth');
const { generateAccessibilityReportController, generateManualAccessibilityReportController, generateDeepAccessibilityReportController } = require('../controllers/downloadController');
const { freeLiteAssessmentUrlSchema } = require('../utils/validationSchema');
const { validateInputs } = require('../middlewares/validation');
const { freeLightAssementController } = require('../controllers/freeLightAssessmentController');


// Configure multer with better file validation
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Use unique filename to prevent collisions
    cb(null, `${Date.now()}-${path.extname(file.originalname)}`);
  }
});

// Add file filter to validate uploads before saving
const fileFilter = (req, file, cb) => {
  // Only accept zip files
  if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
    cb(null, true);
  } else {
    cb(new Error('Only ZIP files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads/')) {
  fs.mkdirSync('uploads/', { recursive: true });
}

// Helper to validate zip file
function isValidZipFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return false;

    const stats = fs.statSync(filePath);
    if (stats.size > 50 * 1024 * 1024) return false; // 50 MB limit

    const zip = new AdmZip(filePath);
    return zip.getEntries().length > 0;
  } catch (error) {
    console.error('Zip validation error:', error);
    return false;
  }
}

// Create router
const router = express.Router();

router.post('/upload', verifyJwt, upload.single('zipfile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      status: 'error',
      message: 'No file uploaded'
    });
  }

  const zipPath = req.file.path;
  const { service_id, org_id } = req.body
  const extractFolder = `extracted`;
  const extractPath = path.join(__dirname, '..', 'uploads', extractFolder);



  try {
    // Validate the zip file
    if (!isValidZipFile(zipPath)) {
      fs.unlinkSync(zipPath);
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or corrupt ZIP file'
      });
    }

    // Extract the zip
    const zip = new AdmZip(zipPath);
    fs.mkdirSync(extractPath, { recursive: true });

    // Security check for path traversal
    const zipEntries = zip.getEntries();
    for (const entry of zipEntries) {
      const entryPath = path.join(extractPath, entry.entryName);
      const relativePath = path.relative(extractPath, entryPath);

      if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        fs.unlinkSync(zipPath);
        fs.rmSync(extractPath, { recursive: true, force: true });
        return res.status(400).json({
          status: 'error',
          message: 'Security violation: ZIP contains invalid paths'
        });
      }
    }

    // Extract all files
    zip.extractAllTo(extractPath, true);

    // Clean up the uploaded zip
    fs.unlinkSync(zipPath);


    const result = await extractFiles(service_id, org_id, extractPath + '/', extractPath + '/');
    const successResponse = SuccessReturnHandler({
      message: SUCCESS_MESSAGES.EXTRACT_REPORT_SUCCESS,
      resp: result,
    });
    res.status(STATUS_CODES.SUCCESS).json(successResponse);
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Error processing upload',
      details: err.message
    });
  }
  finally {
    // Clean up on error
    if (fs.existsSync(zipPath)) {
      try {
        fs.unlinkSync(zipPath);
      } catch (cleanupError) {
        console.error('Error cleaning up zip file:', cleanupError);
      }
    }

    if (fs.existsSync(extractPath)) {
      try {
        fs.rmSync(extractPath, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error('Error cleaning up extracted files:', cleanupError);
      }
    }
  }
});


router.post('/mobile-app-parse', verifyJwt, upload.single('zipfile'), async (req, res) => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || Math.random().toString(36).substr(2, 9);
  let shouldCleanupExtracted = false; // Flag to control cleanup
  console.log(`[${requestId}] Upload request started`, {
    timestamp: new Date().toISOString(),
    userId: req.user?.id,
    userEmail: req.user?.email,
    originalName: req.file?.originalname,
    fileSize: req.file?.size,
    service_id: req.body.service_id,
    org_id: req.body.org_id
  });

  if (!req.file) {
    console.warn(`[${requestId}] Upload failed: No file uploaded`);
    return res.status(400).json({
      status: 'error',
      message: 'No file uploaded'
    });
  }

  const zipPath = req.file.path;
  const { service_id, org_id } = req.body
  const extractFolder = `extracted`;
  const extractPath = path.join(__dirname, '..', 'uploads', extractFolder);

  console.log(`[${requestId}] File upload details`, {
    zipPath,
    extractPath,
    mimetype: req.file.mimetype,
    encoding: req.file.encoding
  });

  try {
    console.log(`[${requestId}] Starting ZIP validation`);
    
    // Validate the zip file
    if (!isValidZipFile(zipPath)) {
      console.error(`[${requestId}] ZIP validation failed: Invalid or corrupt ZIP file`);
      fs.unlinkSync(zipPath);
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or corrupt ZIP file'
      });
    }

    console.log(`[${requestId}] ZIP validation successful`);

    // Extract the zip
    console.log(`[${requestId}] Starting ZIP extraction`);
    const zip = new AdmZip(zipPath);
    fs.mkdirSync(extractPath, { recursive: true,mode: 0o744 });

    // Security check for path traversal
    console.log(`[${requestId}] Starting security checks for path traversal`);
    const zipEntries = zip.getEntries();
    console.log(`[${requestId}] ZIP contains ${zipEntries.length} entries`);
    
    for (const entry of zipEntries) {
      const entryPath = path.join(extractPath, entry.entryName);
      const relativePath = path.relative(extractPath, entryPath);

      console.log(`[${requestId}] Checking entry: ${entry.entryName}`, {
        entryPath,
        relativePath,
        isDirectory: entry.isDirectory
      });

      if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        console.error(`[${requestId}] Security violation detected`, {
          entryName: entry.entryName,
          relativePath,
          isAbsolute: path.isAbsolute(relativePath)
        });
        
        shouldCleanupExtracted = true; // Mark for cleanup
        fs.unlinkSync(zipPath);
        fs.rmSync(extractPath, { recursive: true, force: true });
        return res.status(400).json({
          status: 'error',
          message: 'Security violation: ZIP contains invalid paths'
        });
      }
    }

    console.log(`[${requestId}] Security checks passed, extracting files`);

    // Extract all files
    zip.extractAllTo(extractPath, true);
    console.log(`[${requestId}] ZIP extraction completed successfully`);

    // Clean up the uploaded zip
    fs.unlinkSync(zipPath);
    console.log(`[${requestId}] Original ZIP file cleaned up`);

    console.log(`[${requestId}] Starting file processing with extractMobileFiles function`);
    const result = await extractMobileFiles(service_id, org_id, extractPath, extractPath + '/');

console.log(`[${requestId}] File extraction completed. Inserting into database...`);

// STEP 1: Split screenshots & metadata
const jsonToInsert = result.map(report => ({
  scanname: report.scanname,
  Rules: report.Rules,
  score: report.score,
  tempId: report.tempId
}));

const screenshotsByTempId = {};
for (const report of result) {
  if (report.screenshot && report.tempId) {
    screenshotsByTempId[report.tempId] = report.screenshot;
  }
}

// STEP 2: Insert report metadata (without screenshots)
const pool = await getConnectionPool();

const dbResponse = await pool.request()
  .input('ServiceID', sql.Int, service_id)
  .input('OrgID', sql.UniqueIdentifier, org_id)
  .input('json', sql.NVarChar(sql.MAX), JSON.stringify(jsonToInsert))
  .execute('InsertMobileAccessibilityReport');

const inserted = dbResponse.recordset;

// STEP 3: Update screenshots separately
for (const row of inserted) {
  const { mobile_screen_report_id, tempId } = row;
  // Convert base64 string to buffer
  const screenshot = screenshotsByTempId[tempId];
const base64Data = screenshot.replace(/^data:image\/[a-z]+;base64,/, '');
const screenshotBuffer = Buffer.from(base64Data, 'base64');

await pool.request()
  .input('reportId', sql.Int, mobile_screen_report_id)
  .input('screenshot', sql.VarBinary(sql.MAX), screenshotBuffer) 
  .query(`UPDATE Mobile_Screen_Report SET screenshot = @screenshot WHERE mobile_screen_report_id = @reportId`);
}

// STEP 4: Send response
return res.status(STATUS_CODES.SUCCESS).json(
  SuccessReturnHandler({
    message: SUCCESS_MESSAGES.DETAILS_ADD_SUCCESS,
    resp: {
      summary_report_id: inserted?.[0]?.summary_report_id,
      assessments_count: inserted?.length
    }
  })
);

  } catch (err) {
    shouldCleanupExtracted = true; // Mark for cleanup on error
    const processingTime = Date.now() - startTime;
    console.error(`[${requestId}] Unexpected error during upload processing`, {
      error: err.message,
      stack: err.stack,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Error processing upload',
      details: err.message
    });
  }
  finally {
    console.log(`[${requestId}] Starting cleanup process`);
    
    // Always clean up ZIP file
    if (fs.existsSync(zipPath)) {
      try {
        fs.unlinkSync(zipPath);
        console.log(`[${requestId}] ZIP file cleanup successful`);
      } catch (cleanupError) {
        console.error(`[${requestId}] Error cleaning up zip file:`, cleanupError);
      }
    }

    // Only clean up extracted files on error
    if (shouldCleanupExtracted && fs.existsSync(extractPath)) {
      try {
        fs.rmSync(extractPath, { recursive: true, force: true });
        console.log(`[${requestId}] Extracted files cleanup successful (error case)`);
      } catch (cleanupError) {
        console.error(`[${requestId}] Error cleaning up extracted files:`, cleanupError);
      }
    } else if (!shouldCleanupExtracted) {
      console.log(`[${requestId}] Extracted files preserved at: ${extractPath}`);
    }
  }
});

router.post('/free-lite-assessment', verifyJwt, validateInputs(freeLiteAssessmentUrlSchema), freeLightAssementController);
router.get('/download-docx/:assessment_id', generateAccessibilityReportController);
router.get('/download-manual-docx/:txn_id', generateManualAccessibilityReportController);
router.get('/download-deep-docx', generateDeepAccessibilityReportController);

module.exports = router;