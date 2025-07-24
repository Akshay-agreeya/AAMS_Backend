const { sql, getConnectionPool } = require("../config/db"); 
const { AppError } = require("../middlewares/errorHandler");
const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const {getDatawithPagination} = require("../utils/helper");
const fileTypeFromBuffer = async (buffer) => {
  const fileType = await import('file-type');
  return fileType.fileTypeFromBuffer(buffer);
};

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

exports.updateCategoryAndDetailsService = async (category_id, categoryDetails) => {

    const {
      level,
      issue_description,
      guideline,
      status,
      guideline_url,
      category_report_type,
      category_report_name,
      category_detail_report, 
    } = categoryDetails;
  
    try {
      const pool = await getConnectionPool();
  
     
      const tvp = new sql.Table();
      tvp.columns.add("category_detail_id", sql.BigInt); // Include category_detail_id for updates
      tvp.columns.add("criteria", sql.NVarChar(sql.MAX));
      tvp.columns.add("remediation", sql.NVarChar(sql.MAX));
      tvp.columns.add("page_url", sql.NVarChar(sql.MAX));
      tvp.columns.add("line_numbers", sql.NVarChar(sql.MAX));
      tvp.columns.add("status", sql.NVarChar(50));
  
      // Populate TVP with data
      category_detail_report.forEach((detail) => {
        tvp.rows.add(
          detail.category_detail_id || null, // Use null for new rows
          detail.criteria,
          detail.remediation,
          detail.page_url,
          detail.line_numbers,
          detail.status
        );
      });
  
      const result = await pool
        .request()
        .input("category_id", sql.BigInt, category_id)
        .input("level", sql.NVarChar(50), level)
        .input("issue_description", sql.NVarChar(sql.MAX), issue_description)
        .input("guideline", sql.NVarChar(sql.MAX), guideline)
        .input("status", sql.NVarChar(50), status)
        .input("guideline_url", sql.NVarChar(sql.MAX), guideline_url)
        .input("category_report_type", sql.NVarChar(50), category_report_type)
        .input("category_report_name", sql.NVarChar(50), category_report_name)
        .input("Category_Detail_Report", tvp) 
        .execute("UpdateCategoryAndDetails"); 
  
      return {
        updatedData: result,
         category_id,
      };
    } catch (err) {
      console.error("Error in updateCategoryAndDetailsService:", err);
  
      if (err.code === "EREQUEST") {
        throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
      }
  
      throw new AppError(
        ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        STATUS_CODES.INTERNAL_SERVER_ERROR
      );
    }
  };

  
exports.getUsersService = async (org_id, pageNumber, pageSize) => {
    try{
        const pool = await getConnectionPool();
    
        const result = await pool.request()
        .input("OrgID", sql.UniqueIdentifier, org_id)
        .input("PageNumber", sql.Int, pageNumber)
        .input("PageSize", sql.Int, pageSize)
        .execute("GetUsersByOrgId");
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

exports.deleteCategoryReport = async(category_id) =>{
      try{
        const pool = await getConnectionPool();
        
        const deletedData = await pool.request()
        .input('CategoryID', sql.Int, category_id)
        .query(`DELETE from Category_Report where category_id = @CategoryID`);
    
        return deletedData.rowsAffected;
    
      }catch(err){
        console.error(err);
        if (err.code === 'EREQUEST' ) {
          throw new AppError(err.message, STATUS_CODES.BAD_REQUEST); // Database-level errors
      }
      throw new AppError("An expected error occured:"+ err.message,err.status);
      }
    }

exports.getMobileScreenReportService = async (summary_report_id, pageNumber, pageSize) => {
      try{
          const pool = await getConnectionPool();
      
          const result = await pool.request()
          .input("SummaryReportID", sql.Int, summary_report_id)
          .input("PageNumber", sql.Int, pageNumber)
          .input("PageSize", sql.Int, pageSize)
          .execute("GetMobileScreenReport");
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

  exports.getMobileruleResultsService = async (mobile_screen_report_id, status, pageNumber, pageSize) => {
    try{
        const pool = await getConnectionPool();
    
        const result = await pool.request()
        .input("MobileScreenReportID", sql.Int, mobile_screen_report_id)
        .input("Status", sql.VarChar(10), status)
        .input("PageNumber", sql.Int, pageNumber)
        .input("PageSize", sql.Int, pageSize)
        .execute("GetMobileRuleResults");
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

exports.getScreenshotService = async(mobile_screen_report_id)=>{
  try{
 const pool = await getConnectionPool()
 const result = await pool.request()
 .input("MobileScreenReportID", sql.Int, mobile_screen_report_id)
 .query(`SELECT screenshot from Mobile_Screen_Report where mobile_screen_report_id = @MobileScreenReportID`)

 const imageBuffer = result.recordset[0]?.screenshot;
 if (!imageBuffer) {
  throw new AppError("No image found", STATUS_CODES.NOT_FOUND);
}

// Use file-type to detect the MIME type from the buffer
const typeInfo = await fileTypeFromBuffer(imageBuffer);
const mimeType = typeInfo?.mime || 'image/jpeg'; // fallback to JPEG

   return{imageBuffer, mimeType} 

  }catch(err){
      if (err.code === "EREQUEST" || err.code === "EPARAM") {
          throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
      }
      throw new AppError(err.message, err.status);
  }
}

exports.getMobileRuleResultsRemediationService = async (mobile_screen_report_id, mobile_rule_info_id, status) => {
  try{
      const pool = await getConnectionPool();
  
      const result = await pool.request()
      .input("MobileScreenReportID", sql.Int, mobile_screen_report_id)
      .input("MobileRuleInfoID", sql.Int, mobile_rule_info_id)
      .input("Status", sql.VarChar(10), status)
      .execute("GetMobileRuleDetailsWithRemediation");
      if(!result.recordset.length){
          throw {status: STATUS_CODES.NOT_FOUND, message: ERROR_MESSAGES.DATA_NOT_FOUND}
        }
        const formattedResult = result.recordset.map(record => ({
          ...record,
          props: record.props ? JSON.parse(record.props) : []
      }));
      return {contents: formattedResult};
  }
  catch(err){
      console.error("Database error:", err);
      if (err.code === "EREQUEST" || err.code === "EPARAM") {
          throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
      }
      throw new AppError(err.message, err.status);
  }
}
