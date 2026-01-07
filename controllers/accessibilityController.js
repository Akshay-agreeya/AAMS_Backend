const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const { SUCCESS_MESSAGES } = require('../utils/responseMessages');
const { SuccessReturnHandler } = require('../middlewares/responseHandler');
const { getAccessibilityReportService, uploadAccessibilityExcelService, deleteAccessibilityReportService } = require("../services/accessibilityService");
const fs = require('fs');
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

exports.uploadAccessibilityExcelController = async (req, res, next) => {
    try {
        // Check if file is uploaded
        if (!req.file) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: "No file uploaded. Please upload an Excel file."
            });
        }

        // Get service_id from request body
        const { service_id } = req.body;

        if (!service_id) {
            // Clean up uploaded file
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: "service_id is required"
            });
        }

        // Process the Excel file
        const result = await uploadAccessibilityExcelService(req.file.path, service_id);

        // Clean up uploaded file after processing
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        const successResponse = SuccessReturnHandler({
            message: SUCCESS_MESSAGES.UPLOAD_SUCCESS || "Excel file uploaded and processed successfully",
            resp: result,
        });

        return res.status(STATUS_CODES.SUCCESS).json(successResponse);

    } catch (err) {
        // Clean up uploaded file in case of error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        next(err);
    }
};
exports.deleteAccessibilityReportController = async (req, res, next) => {
    try {
        const { assessment_id } = req.params;
        console.log("Controller: Deleting assessment with ID:", assessment_id);
        const result = await deleteAccessibilityReportService(assessment_id);

        const successResponse = SuccessReturnHandler({
            message: "Assessment deleted successfully",
            resp: result
        });

        return res.status(STATUS_CODES.SUCCESS).json(successResponse);

    } catch (err) {
        next(err);
    }
};