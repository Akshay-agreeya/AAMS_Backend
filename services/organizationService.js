const { sql, getConnectionPool } = require("../config/db");
const { AppError } = require("../middlewares/errorHandler");
const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const { getDatawithPagination } = require("../utils/helper");
const { addNotificationService } = require("./notificationService");

exports.addOrganizationService = async (orgData, created_by) => {
    const {
        org_name, org_type_id, industry_id, address_line, city, state, zip_code, country,
        first_name, last_name, email, phone_number, contract_expiry_date
    } = orgData;

    try {
        const pool = await getConnectionPool();
        
         // 🔹 Set the session context for audit logs
         await pool.request()
         .input("app_user", sql.UniqueIdentifier, created_by)
         .query("EXEC sp_set_session_context @key = 'app_user', @value = @app_user, @read_only = 0;");


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
            .input("ContractExpiryDate", sql.NVarChar(25), contract_expiry_date)
            .input("CreatedBy", sql.UniqueIdentifier, created_by)  
            .execute("AddOrganization");
     
        return result.recordset;

    } catch (err) {
        console.error("Error in addOrganizationService:", err);

        if (err.message && err.message.includes("Violation of UNIQUE KEY constraint")) {
          let field = "org_name";
          const customError = new AppError("Validation error", STATUS_CODES.BAD_REQUEST);
          customError.validationErrors = {
            [field]: `${field.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase())} already exists.`
          };
          throw customError;
        }
        if (
          err.code === "EREQUEST" ||
          err.code === "EPARAM" )
          throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
        throw new AppError(err.message, err.status);
    }
};

exports.getOrganizationByIdService= async(org_id, pageNumber, pageSize)=>{
    try{
       const pool = await getConnectionPool();
  
       const result = await pool.request()
       .input("OrgID", sql.UniqueIdentifier, org_id)
       .input("PageNumber", sql.Int, pageNumber)
       .input("PageSize", sql.Int, pageSize)
       .execute("GetOrganizationDetails");
  
       if(!result.recordset.length){
         throw {status: STATUS_CODES.NOT_FOUND, message: ERROR_MESSAGES.DATA_NOT_FOUND}
       }
     return getDatawithPagination(result.recordsets);
    }catch(err){
      if (err.code === "EREQUEST" || err.code === 'EPARAM') {
        throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
    }
    throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);

    }
  }




// Update your editOrgService function
exports.editOrgService = async(org_id, orgData, modified_by) => {
  const {
    org_name, org_type_id, industry_id, address_line, city, state, zip_code, country,
    first_name, last_name, email, phone_number, contract_expiry_date
  } = orgData;

  try{
    const pool = await getConnectionPool();

     // 🔹 Set the session context for audit logs
     await pool.request()
     .input("app_user", sql.UniqueIdentifier, modified_by)
     .query("EXEC sp_set_session_context @key = 'app_user', @value = @app_user, @read_only = 0;");

    const result = await pool.request()
    .input("OrgID", sql.UniqueIdentifier, org_id)
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
              .input("ContractExpiryDate", sql.NVarChar(25), contract_expiry_date)
              .input("ModifiedBy", sql.UniqueIdentifier, modified_by)  
              .execute("EditOrganization");

    // Add notification after successful organization update
    await addNotificationService(
        modified_by,
        "Organization Updated",
        `Organization "${org_name}" has been updated successfully!`,
        "success"
    );

    return result.recordset;

  } catch (err) {
    console.error("Error in editOrgService:", err);

    if(err.message && err.message.includes("Violation of UNIQUE KEY constraint")) {
      let field = "org_name";
      const customError = new AppError("Validation error", STATUS_CODES.BAD_REQUEST);
      customError.validationErrors = {
        [field]: `${field.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase())} already exists.`
      };
      throw customError;
    }

    if (
      err.code === "EREQUEST" ||
      err.code === "EPARAM"){
        throw new AppError(err.message, STATUS_CODES.BAD_REQUEST)
      }
    
    throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
}


exports.deleteOrgService = async (org_ids, deleted_by) => {
  try {
    const pool = await getConnectionPool();

     // 🔹 Set the session context for audit logs
     await pool.request()
     .input("app_user", sql.UniqueIdentifier, deleted_by)
     .query("EXEC sp_set_session_context @key = 'app_user', @value = @app_user, @read_only = 0;");

    // Delete child records first
    const userOrgDeleteTable = new sql.Table("UDT_OrgID");
    userOrgDeleteTable.columns.add("org_id", sql.UniqueIdentifier);
    org_ids.forEach(id => userOrgDeleteTable.rows.add(id));
    await pool.request()
      .input("OrgIDs", userOrgDeleteTable)
      .query(`DELETE FROM User_Org WHERE org_id IN (SELECT org_id FROM @OrgIDs)`);

    const serviceDeleteTable = new sql.Table("UDT_OrgID");
    serviceDeleteTable.columns.add("org_id", sql.UniqueIdentifier);
    org_ids.forEach(id => serviceDeleteTable.rows.add(id));
    await pool.request()
      .input("OrgIDs", serviceDeleteTable)
      .query(`DELETE FROM Service WHERE org_id IN (SELECT org_id FROM @OrgIDs)`);

    // Add similar deletes for other child tables that reference org_id (User_Product, etc.)

    // Now delete the organization
    const orgDeleteTable = new sql.Table("UDT_OrgID");  // Ensure this matches your SQL type
    orgDeleteTable.columns.add("org_id", sql.UniqueIdentifier);
    org_ids.forEach(id => {
      orgDeleteTable.rows.add(id);
    });
    const orgDeleteResult = await pool.request()
      .input("OrgIDs", orgDeleteTable) // Pass TVP as input
      .input("performed_by", sql.UniqueIdentifier, deleted_by) // Pass performed_by
      .execute("DeleteOrganization"); // Use updated stored procedure

    // Optionally, delete audit_log entries after organization is deleted
    const auditLogDeleteTable2 = new sql.Table("UDT_OrgID");
    auditLogDeleteTable2.columns.add("org_id", sql.UniqueIdentifier);
    org_ids.forEach(id => {
      auditLogDeleteTable2.rows.add(id);
    });
    await pool.request()
      .input("OrgIDs", auditLogDeleteTable2)
      .query(`DELETE FROM audit_log WHERE org_id IN (SELECT org_id FROM @OrgIDs)`);

    return orgDeleteResult.recordset;

    // Create a Table-Valued Parameter (TVP)
    const table = new sql.Table("UDT_OrgID");  // Ensure this matches your SQL type
    table.columns.add("org_id", sql.UniqueIdentifier);

    // Add each org_id to the TVP
    org_ids.forEach(id => {
      table.rows.add(id);
    });

    const result = await pool.request()
      .input("OrgIDs", table) // Pass TVP as input
      .input("performed_by", sql.UniqueIdentifier, deleted_by) // Pass performed_by
      .execute("DeleteOrganization"); // Use updated stored procedure

    return result.recordset;

  } catch (err) {
    console.error(err);
    if (err.code === "EREQUEST" || err.code === "EPARAM") {
      throw new AppError(err.message, STATUS_CODES.BAD_REQUEST); // Database-level errors
    }
    throw new AppError("An unexpected error occurred: " + err.message, err.status);
  }
};


exports.getOrganizationsService = async (user_id, pageNumber, pageSize) => {
    try {
        const pool = await getConnectionPool();

        const result = await pool.request()
            .input("UserID", sql.UniqueIdentifier, user_id)
            .input("PageNumber", sql.Int, pageNumber)
            .input("PageSize", sql.Int, pageSize)
            .execute("GetOrganizations");

        if (!result.recordset.length) {
            throw new AppError(ERROR_MESSAGES.DATA_NOT_FOUND, STATUS_CODES.NOT_FOUND);
        }

        return getDatawithPagination(result.recordsets);

    } catch (err) {
        console.error("Error in getOrganizations", err);
      
        throw new AppError(err.message, err.status);
    }
};



// added by akshay

exports.addOrganizationService = async (orgData, created_by) => {
    const {
        org_name, org_type_id, industry_id, address_line, city, state, zip_code, country,
        first_name, last_name, email, phone_number, contract_expiry_date
    } = orgData;

    try {
        const pool = await getConnectionPool();
        
         // 🔹 Set the session context for audit logs
         await pool.request()
         .input("app_user", sql.UniqueIdentifier, created_by)
         .query("EXEC sp_set_session_context @key = 'app_user', @value = @app_user, @read_only = 0;");

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
            .input("ContractExpiryDate", sql.NVarChar(25), contract_expiry_date)
            .input("CreatedBy", sql.UniqueIdentifier, created_by)  
            .execute("AddOrganization");

        // Add notification after successful organization creation
        await addNotificationService(
            created_by,
            "Organization Added",
            `Organization "${org_name}" has been added successfully!`,
            "success"
        );
     
        return result.recordset;

    } catch (err) {
        console.error("Error in addOrganizationService:", err);

        if (err.message && err.message.includes("Violation of UNIQUE KEY constraint")) {
          let field = "org_name";
          const customError = new AppError("Validation error", STATUS_CODES.BAD_REQUEST);
          customError.validationErrors = {
            [field]: `${field.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase())} already exists.`
          };
          throw customError;
        }
              // Delete related records in child tables before deleting organization
              // Delete from User_Org
              const userOrgDeleteTable = new sql.Table("UDT_OrgID");
              userOrgDeleteTable.columns.add("org_id", sql.UniqueIdentifier);
              org_ids.forEach(id => userOrgDeleteTable.rows.add(id));
              await pool.request()
                .input("OrgIDs", userOrgDeleteTable)
                .query(`DELETE FROM User_Org WHERE org_id IN (SELECT org_id FROM @OrgIDs)`);

              // Delete from Service (if you have a Service table with org_id)
              const serviceDeleteTable = new sql.Table("UDT_OrgID");
              serviceDeleteTable.columns.add("org_id", sql.UniqueIdentifier);
              org_ids.forEach(id => serviceDeleteTable.rows.add(id));
              await pool.request()
                .input("OrgIDs", serviceDeleteTable)
                .query(`DELETE FROM Service WHERE org_id IN (SELECT org_id FROM @OrgIDs)`);

              // Add similar deletes for other child tables that reference org_id (User_Product, etc.)

            // Delete related audit_log entries before deleting organization
            const auditLogDeleteTable = new sql.Table("UDT_OrgID");
            auditLogDeleteTable.columns.add("org_id", sql.UniqueIdentifier);
            org_ids.forEach(id => {
              auditLogDeleteTable.rows.add(id);
            });
            await pool.request()
              .input("OrgIDs", auditLogDeleteTable)
              .query(`DELETE FROM audit_log WHERE org_id IN (SELECT org_id FROM @OrgIDs)`);
        if (
          err.code === "EREQUEST" ||
          err.code === "EPARAM" )
          throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
        throw new AppError(err.message, err.status);
    }
};
