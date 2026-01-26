const express = require('express');
const { verifyJwt } = require('../middlewares/auth');
const uploadExcel = require("../middlewares/uploadExcel");
const { 
    getAccessibilityReportController,
    uploadAccessibilityExcelController,
    deleteAccessibilityReportController  ,
      getOrgAssessmentsController,      // ✅ ADD THIS
    getOrgServiceController   
} = require("../controllers/accessibilityController");


const router = express.Router();

// Single GET API: Get Complete Accessibility Report for an Assessment
// Returns all 4 tabs data: Overview, URL Details, Detailed Findings, WCAG Guidelines
router.get('/report/:assessment_id', getAccessibilityReportController);
router.post("/upload/:org_id", uploadExcel.single("file"), uploadAccessibilityExcelController);
router.delete("/assessment/:assessment_id", deleteAccessibilityReportController);


// Add these new routes to your existing accessibility routes file

// Get all assessments for an organization with metadata
router.get('/org/:org_id/assessments', verifyJwt, getOrgAssessmentsController);

// Get service_id for an organization (optional - if you need it elsewhere)
router.get('/org/:org_id/service', verifyJwt, getOrgServiceController);

module.exports = router;







