const { sql, getConnectionPool } = require("../config/db"); 
const { AppError } = require("../middlewares/errorHandler");
const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");

exports.addProductService = async (org_id, serviceData, created_by) => {
    const {web_url, other_details, service_type_id, guideline_version_id, compliance_level_id, support_type_id,
    frequency_id, scan_day_ids, schedule_time}=serviceData;
 
    try {
        const pool = await getConnectionPool();
        const result = await pool.request()
            .input("OrgID", sql.UniqueIdentifier, org_id)
            .input("WebURL", sql.Text, web_url)
            .input("OtherDetails", sql.Text,other_details)
            .input("ServiceTypeID", sql.Int, service_type_id)
            .input("GuidelineVersionID", sql.Int, guideline_version_id)
            .input("ComplianceLevelID", sql.Int, compliance_level_id)
            .input("SupportTypeID", sql.Int, support_type_id)
            .input("FrequencyID", sql.Int, frequency_id)
            .input("ScanDayIDs", sql.NVarChar(20), scan_day_ids)
            .input("ScheduleTime", sql.VarChar(20), schedule_time)
            .input("CreatedBy", sql.UniqueIdentifier, created_by)
            .output("ServiceID", sql.Int)
            .execute("AddServiceWithDetails");

        return result.recordset ;
    } catch (err) {
        console.error("Error in addProductService:", err);

        if (err.code === "EREQUEST" || err.code === "EPARAM") {
            throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
        }

        throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
};

exports.updateProductService = async (service_id, updatedData, modified_by) => {
    const {web_url, other_details, service_type_id, guideline_version_id, compliance_level_id, support_type_id,
    frequency_id, scan_day_ids, schedule_time}= updatedData;
 
    try {
        const pool = await getConnectionPool();
        const result = await pool.request()
            .input("ServiceID", sql.Int, service_id)
            .input("WebURL", sql.Text, web_url)
            .input("OtherDetails", sql.Text,other_details)
            .input("ServiceTypeID", sql.Int, service_type_id)
            .input("GuidelineVersionID", sql.Int, guideline_version_id)
            .input("ComplianceLevelID", sql.Int, compliance_level_id)
            .input("SupportTypeID", sql.Int, support_type_id)
            .input("FrequencyID", sql.Int, frequency_id)
            .input("ScanDayIDs", sql.NVarChar(20), scan_day_ids)
            .input("ScheduleTime", sql.VarChar(20), schedule_time)
            .input("ModifiedBy", sql.UniqueIdentifier, modified_by)
            .execute("UpdateServiceWithDetails");

        return result.recordset ;
    } catch (err) {
        console.error("Error in updateProductService:", err);

        if (err.code === "EREQUEST" || err.code === "EPARAM") {
            throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
        }

        throw new AppError(err.message, err.status);
    }
};
