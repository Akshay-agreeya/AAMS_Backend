const { sql, getConnectionPool } = require("../config/db");
const { STATUS_CODES } = require("../utils/errorCodes");
const { AppError } = require("../middlewares/errorHandler");


exports.getAssessmentReportMetadataService = async (assessment_id) => {
    try {
        const pool = await getConnectionPool();

        const result = await pool.request()
            .input("assessment_id", sql.Int, assessment_id)
            .query(`
                SELECT 
                    report_meta_id,
                    assessment_id,
                    prepared_for,
                    report_date
                // FROM Assessment_Report_Metadata_DEV
                FROM Assessment_Report_Metadata

                WHERE assessment_id = @assessment_id
            `);

        if (!result.recordset.length) {
            return null;
        }

        return result.recordset[0];

    } catch (err) {
        console.error("Error in getAssessmentReportMetadataService:", err);

        throw new AppError(
            err.message || "Error fetching assessment report metadata",
            STATUS_CODES.INTERNAL_SERVER_ERROR || 500   
        );
    }
};
