const express = require('express');
const multer = require('multer');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const { extractFiles } = require('../utils/extractFiles');
const { SuccessReturnHandler } = require('../middlewares/responseHandler');
const { STATUS_CODES } = require('../utils/errorCodes');
const { SUCCESS_MESSAGES } = require('../utils/responseMessages');


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

router.post('/upload', upload.single('zipfile'), async(req, res) => {
  if (!req.file) {
    return res.status(400).json({
      status: 'error',
      message: 'No file uploaded'
    });
  }

  const zipPath = req.file.path;
  const {service_id, org_id }= req.body
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


const result =  await extractFiles(service_id, org_id, extractPath + '/', extractPath + '/');
const successResponse = SuccessReturnHandler({
  message : SUCCESS_MESSAGES.EXTRACT_REPORT_SUCCESS,
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

module.exports = router;