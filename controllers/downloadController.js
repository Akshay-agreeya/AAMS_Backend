const { generateAccessibilityReport, generateManualAccessibilityReport, generateDeepAccessibilityReport } = require("../services/downloadService");


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