const express = require("express");
const router = express.Router();
const {
    getAssessmentReportMetadata
} = require("../controllers/reportSummaryController");

// GET report metadata by assessment id
router.get("/:assessment_id/report-metadata", getAssessmentReportMetadata);

module.exports = router;
