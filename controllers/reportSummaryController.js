const { getAssessmentReportMetadataService } = require("../services/reportSummaryService");
const { STATUS_CODES } = require("../utils/errorCodes");

exports.getAssessmentReportMetadata = async (req, res, next) => {
    try {
        const { assessment_id } = req.params;

        const data = await getAssessmentReportMetadataService(assessment_id);

        if (!data) {
            return res.status(STATUS_CODES?.NOT_FOUND || 404).json({
                success: false,
                message: "Report metadata not found for this assessment"
            });
        }

        return res.status(STATUS_CODES?.OK || 200).json({
            success: true,
            data
        });

    } catch (err) {
        next(err);
    }
};
