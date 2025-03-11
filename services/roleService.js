const { sql, getConnectionPool } = require("../config/db");
const { ERROR_MESSAGES, STATUS_CODES } = require("../utils/errorCodes");
const { AppError } = require("../middlewares/errorHandler");
const { SUCCESS_MESSAGES } = require("../utils/responseMessages");
const { getDatawithPagination } = require("../utils/helper");

exports.getRolesService = async (pageNumber, pageSize) => {
    try {
    const pool = await getConnectionPool();

    const result = await pool.request()
    .input("PageNumber", sql.Int, pageNumber)
    .input("PageSize", sql.Int, pageSize)
    .execute("GetRoles");
    if (!result.recordset.length) {
        throw { status: STATUS_CODES.NOT_FOUND };
    }
    return getDatawithPagination(result.recordsets);
  } catch (error) {
    console.error("Database Error:", error);
    throw new AppError(error.message, STATUS_CODES.BAD_REQUEST);

  }
};

exports.addRoleAndDetailsService = async(roleDetails, created_by) => {
    const{role_name,
          description,
          role_permissions
        } = roleDetails
  
        try{
          const pool = await getConnectionPool();
          const result = await pool.request()
          .input("RoleName", sql.NVarChar(50), role_name)
          .input("Description", sql.NVarChar(255), description)
          .input("RolePermissions", sql.NVarChar(sql.MAX), JSON.stringify(role_permissions))
          .input("CreatedBy", sql.UniqueIdentifier, created_by)
          .execute("AddRoleWithDetails");

          if (result.recordset[0].ErrorMessage) {
            throw new AppError(result.recordset[0].ErrorMessage, STATUS_CODES.CONFLICT);
          }
          return result.recordset;
        }
        catch(err){
        console.error('Error in addRoleAndDetailsService:', err);
  
        if(err.code === 'EREQUEST' || err.code === 'EPARAM'){
          throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
        }
        throw new AppError(err.message, err.status);
  
        }
  };

exports.updateRoleAndDetailsService = async(role_id, roleDetails, modified_by)=>{
    const pool = await getConnectionPool();
    try{
      const{
        role_name,
        description,
        role_permissions
      }= roleDetails
      const result = await pool.request()
      .input("RoleID", sql.Int, role_id)
      .input("RoleName", sql.NVarChar(50), role_name)
      .input("Description", sql.NVarChar(255), description)
      .input("RolePermissions", sql.NVarChar(sql.MAX), JSON.stringify(role_permissions))
      .input("ModifiedBy", sql.UniqueIdentifier, modified_by)
      .execute("UpdateRoleWithDetails");
    
      if (result.recordset[0].ErrorState === 1) {
        throw new AppError(result.recordset[0].ErrorMessage, STATUS_CODES.NOT_FOUND);
      }

      if (result.recordset[0].ErrorState === 2) {
        throw new AppError(result.recordset[0].ErrorMessage, STATUS_CODES.CONFLICT);
      }
      return result.recordset;
    }catch(err){
        console.error('Error in updateRoleAndDetailsService:', err);

        if(err.code === 'EREQUEST' || err.code === 'EPARAM'){
          throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
        }
        throw new AppError(err.message, err.status);
  
        }
    }

exports.getRoleWithDetailsService = async (role_id) => {
      try {
        const pool = await getConnectionPool();
    
        const result = await pool.request()
          .input("RoleID", sql.Int, role_id)
          .execute("GetRoleWithDetails");
    
        const roleInfo = result.recordsets[0] || [];
        const roleDetails = result.recordsets[1] || [];
    
        if (result.recordset[0].ErrorState === 1) {
          throw new AppError(result.recordset[0].ErrorMessage, STATUS_CODES.NOT_FOUND);
        }
        return {
          role: roleInfo[0],
          details: roleDetails,
        };
      } catch (error) {
        console.error("Error in getRoleWithDetails:", error);
    
        if (error.code === 'EREQUEST') {
          throw new AppError(error.message, STATUS_CODES.BAD_REQUEST);
        }
        throw new AppError(error.message, error.status);
      }
    };
    
    exports.deleteRoleService = async(role_id) =>{
      try{
        const pool = await getConnectionPool();
        const result = await pool.request()
        .input("RoleID", sql.Int, role_id)
        .execute("DeleteRole");
    
        if (result.recordset[0].ErrorState === 1) {
          throw new AppError(result.recordset[0].ErrorMessage, STATUS_CODES.NOT_FOUND);
        }
        return result.recordset;
    
      }catch(err){
        console.error(err);
        if (err.code === 'EREQUEST' || err.code === 'EPARAM') {
          throw new AppError(err.message, STATUS_CODES.BAD_REQUEST); // Database-level errors
      }
      throw new AppError(err.message,err.status);
      }
    }
  
    