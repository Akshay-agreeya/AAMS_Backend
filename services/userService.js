const bcrypt = require("bcrypt");
const { sql, getConnectionPool } = require("../config/db"); // Database connection
const { AppError } = require("../middlewares/errorHandler");
const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const {getDatawithPagination} = require("../utils/helper")

exports.addUserToOrganizationService = async (org_id, userData, created_by) => {
    const {username, first_name, last_name, email, phone_number, password, role_id, status_id}=userData;
    try {
        const pool = await getConnectionPool();
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

         // 🔹 Set the session context for audit logs
         await pool.request()
         .input("app_user", sql.UniqueIdentifier, created_by)
         .query("EXEC sp_set_session_context @key = 'app_user', @value = @app_user, @read_only = 0;");


        const result = await pool.request()
            .input("OrgID", sql.UniqueIdentifier, org_id)
            .input("UserName", sql.VarChar(50),username)
            .input("FirstName", sql.VarChar(50), first_name)
            .input("LastName", sql.VarChar(50), last_name)
            .input("Email", sql.VarChar(50), email)
            .input("PhoneNumber", sql.VarChar(20), phone_number)
            .input("Password", sql.NVarChar(255), hashedPassword)
            .input("RoleID", sql.Int, role_id) 
            .input("StatusID", sql.Int, status_id) 
            .input("CreatedBy", sql.UniqueIdentifier, created_by)
            .execute("AddUserToOrganization");

        return result.recordset ;
    } catch (err) {
        console.error("Error in addUserToOrganizationService:", err);

        if (err.code === "EREQUEST" || err.code === "EPARAM") {
            throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
        }

        throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
};

exports.editUserService = async (user_id, updatedData, modified_by) => {
    const {first_name, last_name, email, phone_number, role_id} = updatedData;
    try {
        const pool = await getConnectionPool();

         // 🔹 Set the session context for audit logs
         await pool.request()
         .input("app_user", sql.UniqueIdentifier, modified_by)
         .query("EXEC sp_set_session_context @key = 'app_user', @value = @app_user, @read_only = 0;");


        const result = await pool.request()
            .input("UserID", sql.UniqueIdentifier, user_id)
            .input("FirstName", sql.VarChar(50), first_name)
            .input("LastName", sql.VarChar(50), last_name)
            .input("Email", sql.VarChar(50), email)
            .input("PhoneNumber", sql.VarChar(20), phone_number)
            .input("RoleID", sql.Int, role_id) 
            .input("ModifiedBy", sql.UniqueIdentifier, modified_by)
            .execute("UpdateUser");

        return result.recordset ;
    } catch (err) {
        console.error("Error in editUserService:", err);

        if (err.code === "EREQUEST" || err.code === "EPARAM") {
            throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
        }

        throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
};

exports.viewUserService = async (user_id) => {
try{
    const pool = await getConnectionPool();

    const result = await pool.request()
    .input("UserID", sql.UniqueIdentifier, user_id)
    .execute("GetUserDetailsById");
    if(!result.recordset.length){
        throw {status: STATUS_CODES.NOT_FOUND, message: ERROR_MESSAGES.DATA_NOT_FOUND}
      }
    return result.recordset[0];
}
catch(err){
    console.error("Database error:", err);

    if (err.code === "EREQUEST" || err.code === "EPARAM") {
        throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
    }
    throw new AppError(err.message, err.status);
}
}

exports.deleteUserService = async(user_id, deleted_by) =>{
    try{
      const pool = await getConnectionPool();

       // 🔹 Set the session context for audit logs
       await pool.request()
       .input("app_user", sql.UniqueIdentifier, deleted_by)
       .query("EXEC sp_set_session_context @key = 'app_user', @value = @app_user, @read_only = 0;");


      const result = await pool.request()
      .input("UserID", sql.UniqueIdentifier, user_id)
      .execute("DeleteUser");
  
      return result.recordset;
  
    }catch(err){
      console.error(err);
      if (err.code === 'EREQUEST' || err.code === 'EPARAM') {
        throw new AppError(err.message, STATUS_CODES.BAD_REQUEST); // Database-level errors
    }
    throw new AppError("An expected error occured:"+ err.message,err.status);
    }
  }

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

    
exports.updateUserStatusService = async (user_id,status_id) => {
        
        try {
            const pool = await getConnectionPool();
    
            const result = await pool.request()
                .input("UserID", sql.UniqueIdentifier, user_id)
                .input("StatusID", sql.Int,status_id)
                .execute("UpdateUserStatus");
    
            return result.recordset ;
        } catch (err) {
            console.error("Error in updateUserStatusService", err);
    
            if (err.code === "EREQUEST" || err.code === "EPARAM") {
                throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
            }
    
            throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
        }
    };
