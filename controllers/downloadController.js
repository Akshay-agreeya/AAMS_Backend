

// downloadController.js
const { 
  generateAccessibilityReport, 
  generateManualAccessibilityReport, 
  generateDeepAccessibilityReport,
  generateAccessibilityReportPDF,
  generateManualAccessibilityReportPDF,
  generateDeepAccessibilityReportPDF
} = require("../services/downloadService");

// Word Controllers (your existing ones)
exports.generateAccessibilityReportController = async (req, res, next) => {
  try {
    const { assessment_id } = req.params;
    const { buffer, filename } = await generateAccessibilityReport(assessment_id);
    
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

exports.generateManualAccessibilityReportController = async (req, res, next) => {
  try {
    const { txn_id } = req.params;
    const { buffer, filename } = await generateManualAccessibilityReport(txn_id);
    
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

exports.generateDeepAccessibilityReportController = async (req, res, next) => {
  try {
    const { assessment_id, txn_id } = req.query;
    const { buffer, filename } = await generateDeepAccessibilityReport(assessment_id, txn_id);
    
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

// exports.generateAccessibilityReportPDFController = async (req, res, next) => {
//   try {
//     const { assessment_id } = req.params;
//     const { buffer, filename } = await generateAccessibilityReportPDF(assessment_id);
    
//     // Debug: Check buffer properties
//     console.log('PDF Buffer info:', {
//       filename,
//       bufferLength: buffer ? buffer.length : 'undefined',
//       bufferType: typeof buffer,
//       isBuffer: Buffer.isBuffer(buffer)
//     });
    
//     // Verify buffer has content
//     if (!buffer || buffer.length === 0) {
//       throw new Error('PDF buffer is empty or undefined');
//     }
    
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
//     res.send(buffer);
//   } catch (err) {
//     console.error('PDF Controller Error:', err);
//     next(err);
//   }
// };


exports.generateAccessibilityReportPDFController = async (req, res, next) => {
  try {
    const { assessment_id } = req.params;
    const { buffer, filename } = await generateAccessibilityReportPDF(assessment_id);

    console.log('PDF Buffer info:', {
      filename,
      bufferLength: buffer ? buffer.length : 'undefined',
      bufferType: typeof buffer,
      isBuffer: Buffer.isBuffer(buffer)
    });

    if (!buffer || buffer.length === 0) {
      throw new Error('PDF buffer is empty or undefined');
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.end(buffer); // 🔑 use end instead of send
  } catch (err) {
    console.error('PDF Controller Error:', err);
    next(err);
  }
};

exports.generateManualAccessibilityReportPDFController = async (req, res, next) => {
  try {
    const { txn_id } = req.params;
    const { buffer, filename } = await generateManualAccessibilityReportPDF(txn_id);
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.end(buffer);
  } catch (err) {
    next(err);
  }
};

exports.generateDeepAccessibilityReportPDFController = async (req, res, next) => {
  try {
    const { assessment_id, txn_id } = req.query;
    const { buffer, filename } = await generateDeepAccessibilityReportPDF(assessment_id, txn_id);
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.end(buffer);
  } catch (err) {
    next(err);
  }
};























// const { generateAccessibilityReport, generateManualAccessibilityReport, generateDeepAccessibilityReport } = require("../services/downloadService");

// const { 
//   generateAccessibilityReportPDF, 
//   generateManualAccessibilityReportPDF, 
//   generateDeepAccessibilityReportPDF 
// } = require("../services/downloadService");

// exports.generateAccessibilityReportPDFController = async (req, res, next) => {
//   try {
//     const { assessment_id } = req.params;
//     const { buffer, filename } = await generateAccessibilityReportPDF(assessment_id);
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
//     res.send(buffer);
//   } catch (err) {
//     next(err);
//   }
// };


// exports.generateAccessibilityReportController = async (req, res, next) => {
//   try {
//     const { assessment_id } = req.params;

//     const { buffer, filename } = await generateAccessibilityReport(assessment_id);

//     res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
//     res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
//     res.send(buffer);
//   } catch (err) {
//     next(err); 
//   }
// };

// exports.generateManualAccessibilityReportController = async (req, res, next) => {
//   try {
//     const { txn_id } = req.params;

//     const { buffer, filename } = await generateManualAccessibilityReport(txn_id);

//     res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
//     res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
//     res.send(buffer);
//   } catch (err) {
//     next(err); 
//   }
// };

// exports.generateDeepAccessibilityReportController = async (req, res, next) => {
//   try {
//     const { assessment_id, txn_id } = req.query;

//     const { buffer, filename } = await generateDeepAccessibilityReport(assessment_id, txn_id);

//     res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
//     res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
//     res.send(buffer);
//   } catch (err) {
//     next(err); 
//   }
// };


// exports.generateAccessibilityReportPDFController = async (req, res, next) => {
//   try {
//     const { assessment_id } = req.params;
    
//     const { buffer, filename } = await generateAccessibilityReportPDF(assessment_id);
    
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
//     res.send(buffer);
//   } catch (err) {
//     next(err);
//   }
// };

// exports.generateManualAccessibilityReportPDFController = async (req, res, next) => {
//   try {
//     const { txn_id } = req.params;
    
//     const { buffer, filename } = await generateManualAccessibilityReportPDF(txn_id);
    
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
//     res.send(buffer);
//   } catch (err) {
//     next(err);
//   }
// };

// exports.generateDeepAccessibilityReportPDFController = async (req, res, next) => {
//   try {
//     const { assessment_id, txn_id } = req.query;
    
//     const { buffer, filename } = await generateDeepAccessibilityReportPDF(assessment_id, txn_id);
    
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
//     res.send(buffer);
//   } catch (err) {
//     next(err);
//   }
// };

