const { sql, getConnectionPool } = require("../config/db"); // Database connection
const { AppError } = require("../middlewares/errorHandler");
const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");

exports.getPermissionService = async (org_id) => {
    try{
        const pool = await getConnectionPool();
    
        const result = await pool.request()
        .input("OrgID", sql.UniqueIdentifier, org_id)
        .execute("GetProductPermissionsByOrgID");
        if(!result.recordset.length){
            throw {status: STATUS_CODES.NOT_FOUND, message: ERROR_MESSAGES.DATA_NOT_FOUND}
          }
          const record = result.recordset[0]; // Since we get one row with multiple JSON columns
          const parsedData = {
    Users: JSON.parse(record.Users || "[]"), 
    Service: JSON.parse(record.Service || "[]"), 
    prod_permissions: JSON.parse(record.prod_permissions || "[]"), 
    allPermissions: JSON.parse(record.allPermissions || "[]")
};
return parsedData;
    }
    catch(err){
        console.error("Database error:", err);
    
        if (err.code === "EREQUEST" || err.code === "EPARAM") {
            throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
        }
        throw new AppError(err.message, err.status);
    }
    }

exports.updateUserPermissionService = async (usersWithServices, performed_by) => {
        try {
            const pool = await getConnectionPool();

            await pool.request()
            .input("app_user", sql.UniqueIdentifier, performed_by)
            .query("EXEC sp_set_session_context @key = 'app_user', @value = @app_user, @read_only = 0;");
   
            const results = [];
    
            for (const userService of usersWithServices) {
                const { user_id, service_id, product_permission_opr_ids } = userService;
    
                if (product_permission_opr_ids.length === 0) {
                    // If no permissions, delete all for the user and service
                    const deleteResult = await pool.request()
                        .input("UserId", sql.UniqueIdentifier, user_id)
                        .input("ServiceId", sql.Int, service_id)
                        .execute("DeleteUserPermissions");
    
                    const deleted = deleteResult.recordset[0]?.Deleted === 1;
    
                    results.push({ user_id, service_id, deleted });
                } else {
                    const newPermissionsString = product_permission_opr_ids.join(",");
    
                    const result = await pool.request()
                        .input("UserId", sql.UniqueIdentifier, user_id)
                        .input("ServiceId", sql.Int, service_id)
                        .input("NewPermissions", sql.VarChar, newPermissionsString)
                        .execute("UpdateUserPermissions");
    
                    if (result.recordset.length) {
                        results.push(result.recordset);
                    }
                }
            }
    
            if (results.length === 0) {
                throw { status: STATUS_CODES.NOT_FOUND, message: ERROR_MESSAGES.DATA_NOT_FOUND };
            }
    
            return results;
        } catch (err) {
            console.error("Error in updateUserPermissionService:", err);
    
            if (err.code === "EREQUEST" || err.code === "EPARAM") {
                throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
            }
    
            throw new AppError(err.message, err.status);
        }
    };
    

    
    

    