const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const { SUCCESS_MESSAGES } = require('../utils/responseMessages');
const { SuccessReturnHandler } = require('../middlewares/responseHandler');
const { getAccessibilityReportService } = require("../services/accessibilityService");

/**
 * Get Complete Accessibility Report
 * Returns all 4 tabs data in a single response:
 * - Tab 1: Accessibility Overview (Conformance Score, WCAG Conformance, Severity, Top Issues)
 * - Tab 2: URL Details (Pages/Components tested)
 * - Tab 3: Detailed Findings (All issues with full details)
 * - Tab 4: WCAG Guidelines Reference
 * 
 * @route GET /api/accessibility/report/:assessment_id
 * @access Protected (JWT required)
 */
exports.getAccessibilityReportController = async (req, res, next) => {
    const { assessment_id } = req.params;

    try {
        const reportData = await getAccessibilityReportService(assessment_id);

        const successResponse = SuccessReturnHandler({
            message: SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
            resp: reportData,
        });
        return res.status(STATUS_CODES.SUCCESS).json(successResponse);
    } catch (err) {
        next(err);
    }
};