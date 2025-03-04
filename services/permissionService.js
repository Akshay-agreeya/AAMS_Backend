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