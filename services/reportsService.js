const { sql, getConnectionPool } = require("../config/db"); 
const { AppError } = require("../middlewares/errorHandler");
const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const {getDatawithPagination} = require("../utils/helper")

exports.getWebUrlsService = async (org_id, pageNumber, pageSize) => {
    try{
        const pool = await getConnectionPool();
    
        const result = await pool.request()
        .input("OrgID", sql.UniqueIdentifier, org_id)
        .input("PageNumber", sql.Int, pageNumber)
        .input("PageSize", sql.Int, pageSize)
        .execute("GetUrls");
        if(!result.recordset.length){
            throw {status: STATUS_CODES.NOT_FOUND, message: ERROR_MESSAGES.DATA_NOT_FOUND}
          }
        return getDatawithPagination(result.recordsets);
    }
    catch(err){
        console.error("Database error:", err);
        if (err.code === "EREQUEST" || err.code === "EPARAM") {
            throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
        }
        throw new AppError(err.message, err.status);
    }
}

exports.getUserWebUrlsService = async (user_id, pageNumber, pageSize) => {
    try{
        const pool = await getConnectionPool();
    
        const result = await pool.request()
        .input("UserID", sql.UniqueIdentifier, user_id)
        .input("PageNumber", sql.Int, pageNumber)
        .input("PageSize", sql.Int, pageSize)
        .execute("GetUserUrls");
        if(!result.recordset.length){
            throw {status: STATUS_CODES.NOT_FOUND, message: ERROR_MESSAGES.DATA_NOT_FOUND}
          }
        return getDatawithPagination(result.recordsets);
    }
    catch(err){
        console.error("Database error:", err);
        if (err.code === "EREQUEST" || err.code === "EPARAM") {
            throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
        }
        throw new AppError(err.message, err.status);
    }
}

exports.getAssessmentsService = async (service_id, pageNumber, pageSize) => {
    try{
        const pool = await getConnectionPool();
    
        const result = await pool.request()
        .input("ServiceID", sql.Int, service_id)
        .input("PageNumber", sql.Int, pageNumber)
        .input("PageSize", sql.Int, pageSize)
        .execute("GetAssessmentsByServiceID");
        if(!result.recordset.length){
            throw {status: STATUS_CODES.NOT_FOUND, message: ERROR_MESSAGES.DATA_NOT_FOUND}
          }
        return getDatawithPagination(result.recordsets);
    }
    catch(err){
        console.error("Database error:", err);
        if (err.code === "EREQUEST" || err.code === "EPARAM") {
            throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
        }
        throw new AppError(err.message, err.status);
    }
}

exports.getCategoryDataService = async (assessment_id) => {
    try{
        const pool = await getConnectionPool();
    
        const result = await pool.request()
        .input("AssessmentID", sql.Int, assessment_id)
        .execute("GetCategoryReportByAssessmentID");
        if(!result.recordset.length){
            throw {status: STATUS_CODES.NOT_FOUND, message: ERROR_MESSAGES.DATA_NOT_FOUND}
          }
          const accessibilityInfo = result.recordsets[1] || {};
         const formattedResult = result.recordset.map(record => ({
            ...record,
            category_details: record.category_details ? JSON.parse(record.category_details) : []
        }));

        return {contents : formattedResult, accessibilityInfo: accessibilityInfo}
    }
    catch(err){
        console.error("Database error:", err);
        if (err.code === "EREQUEST" || err.code === "EPARAM") {
            throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
        }
        throw new AppError(err.message, err.status);
    }
}