const bcrypt = require("bcrypt");
const { sql, getConnectionPool } = require("../config/db");
const { AppError } = require("../middlewares/errorHandler");
const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");

exports.addOrganizationService = async (orgData, created_by) => {
    const {
        org_name, org_type_id, industry_id, address_line, city, state, zip_code, country,
        first_name, last_name, email, phone_number, contract_expiry_date
    } = orgData;

    try {
        const pool = await getConnectionPool();
        
        const result = await pool.request()
            .input("OrgName", sql.VarChar(100), org_name)
            .input("OrgTypeID", sql.Int, org_type_id)
            .input("IndustryID", sql.Int, industry_id)
            .input("AddressLine", sql.VarChar(255), address_line)
            .input("City", sql.VarChar(50), city)
            .input("State", sql.VarChar(50), state)
            .input("ZipCode", sql.VarChar(20), zip_code)
            .input("Country", sql.VarChar(50), country)
            .input("FirstName", sql.VarChar(50), first_name)
            .input("LastName", sql.VarChar(50), last_name)
            .input("Email", sql.VarChar(50), email)
            .input("PhoneNumber", sql.VarChar(20), phone_number)
            .input("ContractExpiryDate", sql.Date, contract_expiry_date)
            .input("CreatedBy", sql.UniqueIdentifier, created_by)  
            .execute("AddOrganization");
       console.log(result);
        return result.recordset;

    } catch (err) {
        console.error("Error in addOrganizationService:", err);

        if (err.code === "EREQUEST") {
            throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
        }

        throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
};

exports.getOrganizationByIdService= async(org_id)=>{
    try{
       const pool = await getConnectionPool();
  
       const result = await pool.request()
       .input("OrgID", sql.UniqueIdentifier, org_id)
       .execute("GetOrganizationByID");
  
       if(!result.recordset.length){
         throw {status: STATUS_CODES.NOT_FOUND, message: ERROR_MESSAGES.DATA_NOT_FOUND}
       }
     return result.recordset[0];
    }catch(err){
      console.error("Database error:", err);
      throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
    }
  }
