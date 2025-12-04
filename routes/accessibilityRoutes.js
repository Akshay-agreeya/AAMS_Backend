const express = require('express');
const {
    getAccessibilityReportController
} = require('../controllers/accessibilityController');
const { verifyJwt } = require('../middlewares/auth');

const router = express.Router();

// Single GET API: Get Complete Accessibility Report for an Assessment
// Returns all 4 tabs data: Overview, URL Details, Detailed Findings, WCAG Guidelines
router.get('/report/:assessment_id', getAccessibilityReportController);

module.exports = router;