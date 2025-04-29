const { sql, getConnectionPool } = require("../config/db"); 
const { AppError } = require("../middlewares/errorHandler");
const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const {getDatawithPagination} = require("../utils/helper");

exports.addProductService = async (org_id, serviceData, created_by) => {
  const {
      web_url,
      other_details,
      service_type_id = 1,  // Optional default
      guideline_version_id,
      compliance_level_id,
      support_type_id,
      frequency_id,
      scan_day_ids,
      schedule_time
  } = serviceData;

  try {
      const pool = await getConnectionPool();

      
      await pool.request()
          .input("app_user", sql.UniqueIdentifier, created_by)
          .query("EXEC sp_set_session_context @key = 'app_user', @value = @app_user, @read_only = 0;");

      const request = pool.request();

      request.input("OrgID", sql.UniqueIdentifier, org_id);
      request.input("WebURL", sql.Text, web_url);
      request.input("OtherDetails", sql.Text, other_details || null);
      request.input("ServiceTypeID", sql.Int, service_type_id);
      request.input("GuidelineVersionID", sql.Int, guideline_version_id);
      request.input("ComplianceLevelID", sql.Int, compliance_level_id);
      request.input("SupportTypeID", sql.Int, support_type_id);
      request.input("FrequencyID", sql.Int, frequency_id);
      request.input("ScanDayIDs", sql.NVarChar(sql.MAX), scan_day_ids);
      request.input("ScheduleTime", sql.Time, schedule_time);
      request.input("CreatedBy", sql.UniqueIdentifier, created_by);
      request.output("ServiceID", sql.Int);

      const result = await request.execute("AddServiceWithDetails");

      return result.recordset;
  } catch (err) {
      console.error("Error in addProductService:", err);

     
      if (
          err.code === "EREQUEST" ||
          err.code === "EPARAM" ||
          (err.message && err.message.includes("Web URL") && err.message.includes("UNIQUE"))
      ) {
          const field = "web_url";
          const customError = new AppError("Validation error", STATUS_CODES.BAD_REQUEST);
          customError.validationErrors = {
              [field]: `${field.replace(/_/g, ' ')} already exists.`
          };
          throw customError;
      }

      throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
};

exports.updateProductService = async (service_id, updatedData, modified_by) => {
    const {web_url, other_details, service_type_id, guideline_version_id, compliance_level_id, support_type_id,
    frequency_id, scan_day_ids, schedule_time}= updatedData;
 
    try {
        const pool = await getConnectionPool();

             // 🔹 Set the session context for audit logs
             await pool.request()
             .input("app_user", sql.UniqueIdentifier, modified_by)
             .query("EXEC sp_set_session_context @key = 'app_user', @value = @app_user, @read_only = 0;");


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
            .input("ScheduleTime", sql.Time, schedule_time)
            .input("ModifiedBy", sql.UniqueIdentifier, modified_by)
            .execute("UpdateServiceWithDetails");

        return result.recordset ;
    } catch (err) {
        console.error("Error in updateProductService:", err);

        if (
            err.code === "EREQUEST" ||
            err.code === "EPARAM" ||
            (err.message && err.message.includes("Violation of UNIQUE KEY constraint"))
          ) {
            let field = "Web_Url";
            const customError = new AppError("Validation error", STATUS_CODES.BAD_REQUEST);
            customError.validationErrors = {
              [field]: `${field.replace(/_/g, ' ')} already exists.`
            };
            throw customError;
          }
          
        throw new AppError(err.message, err.status);
    }
};

exports.viewProductService = async (service_id) => {
    try{
        const pool = await getConnectionPool();
    
        const result = await pool.request()
        .input("ServiceID", sql.Int, service_id)
        .execute("GetServiceDetailsByServiceID");
        if(!result.recordset.length){
            throw {status: STATUS_CODES.NOT_FOUND, message: ERROR_MESSAGES.DATA_NOT_FOUND}
          }
        return result.recordset[0];
    }
    catch(err){
        console.error("Database error:", err);
        throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
    }
}

exports.getProductsService = async (org_id, pageNumber, pageSize) => {
        try{
            const pool = await getConnectionPool();
        
            const result = await pool.request()
            .input("OrgID", sql.UniqueIdentifier, org_id)
            .input("PageNumber", sql.Int, pageNumber)
            .input("PageSize", sql.Int, pageSize)
            .execute("GetServiceDetailsByOrgID");
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

exports.myProductsService = async (user_id, pageNumber, pageSize) => {
    try{
        const pool = await getConnectionPool();
    
        const result = await pool.request()
        .input("UserID", sql.UniqueIdentifier, user_id)
        .input("PageNumber", sql.Int, pageNumber)
        .input("PageSize", sql.Int, pageSize)
        .execute("MyProducts");
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

 exports.deleteProductService = async(service_id, deleted_by) =>{
    try{
      const pool = await getConnectionPool();

      // 🔹 Set the session context for audit logs
      await pool.request()
      .input("app_user", sql.UniqueIdentifier, deleted_by)
      .query("EXEC sp_set_session_context @key = 'app_user', @value = @app_user, @read_only = 0;");


      const result = await pool.request()
      .input("ServiceID", sql.Int, service_id)
      .execute("DeleteServiceByServiceID ");
  
      return result.recordset;
  
    }catch(err){
      console.error(err);
      if (err.code === 'EREQUEST' || err.code === 'EPARAM') {
        throw new AppError(err.message, STATUS_CODES.BAD_REQUEST); 
    }
    throw new AppError(err.message,err.status);
    }
  }

