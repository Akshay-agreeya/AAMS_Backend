const express = require('express');
const { verifyJwt } = require('../middlewares/auth');
const uploadExcel = require("../middlewares/uploadExcel");
const { 
    getAccessibilityReportController,
    uploadAccessibilityExcelController,
    deleteAccessibilityReportController  
} = require("../controllers/accessibilityController");


const router = express.Router();

// Single GET API: Get Complete Accessibility Report for an Assessment
// Returns all 4 tabs data: Overview, URL Details, Detailed Findings, WCAG Guidelines
router.get('/report/:assessment_id', getAccessibilityReportController);
router.post("/upload", uploadExcel.single("file"), uploadAccessibilityExcelController)
router.delete("/assessment/:assessment_id", deleteAccessibilityReportController);


module.exports = router;