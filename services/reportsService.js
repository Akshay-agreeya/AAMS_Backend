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

exports.getUserWebUrlsService = async (user_id, pageNumber, pageSize, permission_name) => {
    try{
        const pool = await getConnectionPool();
    
        const result = await pool.request()
        .input("UserID", sql.UniqueIdentifier, user_id)
        .input("PermissionName", sql.VarChar, permission_name)
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
          const accessibilityInfo = result.recordsets[1]?.[0] || {};
         const formattedResult = result.recordset.map(record => ({
            ...record,
            category_details: record.category_details ? JSON.parse(record.category_details) : []
        }));

        return {contents : formattedResult, accessibilityInfo}
    }
    catch(err){
        console.error("Database error:", err);
        if (err.code === "EREQUEST" || err.code === "EPARAM") {
            throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
        }
        throw new AppError(err.message, err.status);
    }
}

exports.insertCategoryAndDetailsService = async (categoryDetails) => {
    const {
      level,
      issue_description,
      guideline,
      failing_page,
      status,
      guideline_url,
      summary_detail_report_id,
      assessment_id,
      category_report_type,
      category_report_name,
      category_detail_report, // This is an array of detail rows
    } = categoryDetails;
  
    try {
      const pool = await getConnectionPool();
  
      // Convert `category_detail_report` to a table-valued parameter
      const tvp = new sql.Table();
      tvp.columns.add("criteria", sql.NVarChar(sql.MAX));
      tvp.columns.add("remediation", sql.NVarChar(sql.MAX));
      tvp.columns.add("page_url", sql.NVarChar(sql.MAX));
      tvp.columns.add("line_numbers", sql.NVarChar(sql.MAX));
      tvp.columns.add("status", sql.NVarChar(50));
  
      category_detail_report.forEach((detail) => {
        tvp.rows.add(
          detail.criteria,
          detail.remediation,
          detail.page_url,
          detail.line_numbers,
          detail.status
        );
      });
  
      const result = await pool
        .request()
        .input("level", sql.NVarChar(50), level)
        .input("issue_description", sql.NVarChar(sql.MAX), issue_description)
        .input("guideline", sql.NVarChar(sql.MAX), guideline)
        .input("failing_page", sql.Int, failing_page)
        .input("status", sql.NVarChar(50), status)
        .input("guideline_url", sql.NVarChar(sql.MAX), guideline_url)
        .input(
          "summary_detail_report_id",
          sql.Int,
          summary_detail_report_id
        )
        .input("assessment_id", sql.Int, assessment_id)
        .input("category_report_type", sql.NVarChar(50), category_report_type)
        .input("category_report_name", sql.NVarChar(50), category_report_name)
        .input("Category_Detail_Report", tvp)
        .execute("InsertCategoryAndDetails");
  
      return {
        message: result || "Operation successful.",
        categoryId: result.output.category_id,
      };
    } catch (err) {
      console.error("Error in insertCategoryAndDetailsService:", err);
  
      if (err.code === "EREQUEST") {
        throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
      }
  
      throw new AppError(
        ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        STATUS_CODES.INTERNAL_SERVER_ERROR
      );
    }
  };