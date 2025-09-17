const bcrypt = require("bcrypt");
const { sql, getConnectionPool } = require("../config/db"); // Database connection
const { AppError } = require("../middlewares/errorHandler");
const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const {getDatawithPagination} = require("../utils/helper");
const { addNotificationService } = require("./notificationService"); // Add this import
// const sendEmail = require("../utils/sendEmail"); // adjust path if needed
// const { sendWelcomeEmail } = require("../services/emailService");
const { sendWelcomeEmail } = require("../services/emailService");


const fileTypeFromBuffer = async (buffer) => {
    const fileType = await import('file-type');
    return fileType.fileTypeFromBuffer(buffer);
  };
  

exports.addUserToOrganizationService = async (org_id, userData, created_by) => {
    const { username, first_name, last_name, email, phone_number, password, role_id, status_id } = userData;

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
            .input("UserName", sql.VarChar(50), username)
            .input("FirstName", sql.VarChar(50), first_name)
            .input("LastName", sql.VarChar(50), last_name)
            .input("Email", sql.VarChar(50), email)
            .input("PhoneNumber", sql.VarChar(20), phone_number)
            .input("Password", sql.NVarChar(255), hashedPassword)
            .input("RoleID", sql.Int, role_id)
            .input("StatusID", sql.Int, status_id)
            .input("CreatedBy", sql.UniqueIdentifier, created_by)
            .execute("AddUserToOrganization");

        const newUserId = result.recordset[0]?.user_id;

        await sendWelcomeEmail({ first_name, email, password });

        // sendWelcomeEmail({ first_name, email });


        // 🔔 Send notifications (your existing logic)
        await addNotificationService(
            created_by,
            "User Added",
            `User "${first_name} ${last_name}" has been added successfully!`,
            "success"
        );

        if (newUserId) {
            await addNotificationService(
                newUserId,
                "Welcome!",
                `Welcome to the platform! Your account has been created successfully.`,
                "info"
            );
        }

        return result.recordset;
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

        // Add notification to the admin who updated the user
        await addNotificationService(
            modified_by,
            "User Updated",
            `User "${first_name} ${last_name}" has been updated successfully!`,
            "success"
        );

        // Add notification to the user whose details were updated
        // Only if the user being updated is different from the one updating
        if (user_id !== modified_by) {
            await addNotificationService(
                user_id,
                "Profile Updated",
                `Your profile details have been updated.`,
                "info"
            );
        }

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

      // First get the user name for notification (optional)
      const userInfo = await pool.request()
        .input("UserID", sql.UniqueIdentifier, user_id)
        .execute("GetUserDetailsById");
      
      const userName = userInfo.recordset[0] 
        ? `${userInfo.recordset[0].first_name} ${userInfo.recordset[0].last_name}` 
        : "User";

       // 🔹 Set the session context for audit logs
       await pool.request()
       .input("app_user", sql.UniqueIdentifier, deleted_by)
       .query("EXEC sp_set_session_context @key = 'app_user', @value = @app_user, @read_only = 0;");

      const result = await pool.request()
      .input("UserID", sql.UniqueIdentifier, user_id)
      .execute("DeleteUser");

      // Add notification after successful user deletion
      await addNotificationService(
          deleted_by,
          "User Deleted",
          `User "${userName}" has been deleted successfully!`,
          "warning"
      );
  
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

exports.updateUserStatusService = async (user_id, status_id, updated_by) => {
        
        try {
            const pool = await getConnectionPool();

            // Get user details for notification
            const userInfo = await pool.request()
                .input("UserID", sql.UniqueIdentifier, user_id)
                .execute("GetUserDetailsById");
            
            const userName = userInfo.recordset[0] 
                ? `${userInfo.recordset[0].first_name} ${userInfo.recordset[0].last_name}` 
                : "User";

            const result = await pool.request()
                .input("UserID", sql.UniqueIdentifier, user_id)
                .input("StatusID", sql.Int, status_id)
                .execute("UpdateUserStatus");

            // Determine status text for notification
            const statusText = status_id === 1 ? "activated" : "deactivated";

            // Add notification to admin who updated the status
            if (updated_by) {
                await addNotificationService(
                    updated_by,
                    "User Status Updated",
                    `User "${userName}" has been ${statusText} successfully!`,
                    "info"
                );
            }

            // Add notification to the user whose status was updated
            // Only if the user being updated is different from the one updating
            if (user_id !== updated_by) {
                await addNotificationService(
                    user_id,
                    "Account Status Changed",
                    `Your account has been ${statusText}.`,
                    status_id === 1 ? "success" : "warning"
                );
            }
    
            return result.recordset ;
        } catch (err) {
            console.error("Error in updateUserStatusService", err);
    
            if (err.code === "EREQUEST" || err.code === "EPARAM") {
                throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
            }
    
            throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
        }
    };

exports.uploadImageService = async(user_id, user_image)=>{
        try{
      const pool = await getConnectionPool()
      const result = await pool.request()
      .input("UserID", sql.UniqueIdentifier, user_id)
      .input("UserImage", sql.VarBinary(sql.MAX), user_image)
      .query(`UPDATE Users
      set user_image = @UserImage
      where user_id = @UserID`)

      if (result.rowsAffected[0] === 0) {
        throw new AppError("No user found or update failed", STATUS_CODES.NOT_FOUND);
      }

      // Add notification for image upload
      await addNotificationService(
          user_id,
          "Profile Picture Updated",
          "Your profile picture has been updated successfully!",
          "success"
      );
  
      return {
        message: "User image updated successfully!",
      };
        }catch(err){
          console.error("Database error:", err);
            if (err.code === "EREQUEST" || err.code === "EPARAM") {
                throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
            }
            throw new AppError(err.message, err.status);
        }
        }

exports.getImageService = async(user_id)=>{
    try{
   const pool = await getConnectionPool()
   const result = await pool.request()
   .input("UserID", sql.UniqueIdentifier, user_id)
   .query(`SELECT user_image from Users where user_id = @UserID`)

   const imageBuffer = result.recordset[0]?.user_image;
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

exports.deleteImageService = async(user_id)=>{
    try{
  const pool = await getConnectionPool()
  const result = await pool.request()
  .input("UserID", sql.UniqueIdentifier, user_id)
  .query(`UPDATE Users
  set user_image = NULL
  where user_id = @UserID`)

  if (result.rowsAffected[0] === 0) {
    throw new AppError("No user found or delete failed", STATUS_CODES.NOT_FOUND);
  }

  // Add notification for image deletion
  await addNotificationService(
      user_id,
      "Profile Picture Removed",
      "Your profile picture has been removed successfully!",
      "info"
  );

  return {
    message: "User image deleted successfully!",
  };
    }catch(err){
      console.error("Database error:", err);
        if (err.code === "EREQUEST" || err.code === "EPARAM") {
            throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
        }
        throw new AppError(err.message, err.status);
    }
    }




















