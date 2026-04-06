const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const { SUCCESS_MESSAGES } = require('../utils/responseMessages');
const { SuccessReturnHandler } = require('../middlewares/responseHandler');
const { getAccessibilityReportService, uploadAccessibilityExcelService, deleteAccessibilityReportService ,
     getOrgAssessmentsService,          
    getOrgServiceService    



} = require("../services/accessibilityService");
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

        // ✅ CHANGED: Get org_id from request params instead of service_id
        const { org_id } = req.params;

        if (!org_id) {
            // Clean up uploaded file
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: "org_id is required"
            });
        }

        // ✅ CHANGED: Process the Excel file with org_id instead of service_id
        const result = await uploadAccessibilityExcelService(req.file.path, org_id);

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



// Get all assessments for an organization
exports.getOrgAssessmentsController = async (req, res, next) => {
    try {
        const { org_id } = req.params;
        
        if (!org_id) {
            return res.status(400).json({
                success: false,
                message: "Organization ID is required"
            });
        }

        const assessments = await getOrgAssessmentsService(org_id);

        return res.status(200).json({
            success: true,
            data: assessments,
            message: "Assessments retrieved successfully"
        });
    } catch (err) {
        next(err);
    }
};

// Get service_id for an organization (optional)
exports.getOrgServiceController = async (req, res, next) => {
    try {
        const { org_id } = req.params;
        
        if (!org_id) {
            return res.status(400).json({
                success: false,
                message: "Organization ID is required"
            });
        }

        const service = await getOrgServiceService(org_id);

        return res.status(200).json({
            success: true,
            data: service,
            message: "Service retrieved successfully"
        });
    } catch (err) {
        next(err);
    }
};