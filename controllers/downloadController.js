const { generateAccessibilityReport } = require("../services/downloadService");


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
