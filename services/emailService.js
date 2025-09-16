// emailService.js - Updated for Outlook
const transporter = require("../config/emailConfig");

exports.sendWelcomeEmail = async ({ first_name, email }) => {
  try {
    await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'AAMS'}" <${process.env.EMAIL}>`,
      to: email,
      subject: "Welcome to AAMS",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome, ${first_name}!</h2>
          <p>Your account has been created successfully on <b>AAMS</b>.</p>
           <p>You can now log in using your email: http://gdc-vm-adaclient:8080/

          <p style="margin-top: 20px;">
            Best regards,<br>
            The AAMS Team
          </p>
        </div>
      `,
    });
    console.log("Welcome email sent to:", email);
    return { success: true, message: "Email sent successfully" };
  } catch (err) {
    console.error("Error sending welcome email:", err.message);
    
    // Don't throw error - just log it and return failure status
    return { 
      success: false, 
      message: "Email sending failed", 
      error: err.message 
    };
  }
};











// // emailService.js - Updated for Outlook
// const transporter = require("../config/emailConfig");

// exports.sendWelcomeEmail = async ({ first_name, email }) => {
//   try {
//     await transporter.sendMail({
//       from: `"${process.env.FROM_NAME}" <${process.env.EMAIL}>`, // Use FROM_NAME from env
//       to: email,
//       subject: "Welcome to AAMS 🎉",
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2 style="color: #333;">Welcome, ${first_name}!</h2>
//           <p>Your account has been created successfully on <b>AAMS</b>.</p>
//           <p>You can now log in using your email: <b>${email}</b></p>
//           <p style="margin-top: 20px;">
//             Best regards,<br>
//             The AAMS Team
//           </p>
//         </div>
//       `,
//     });
//     console.log("✅ Welcome email sent to:", email);
//   } catch (err) {
//     console.error("❌ Error sending welcome email:", err);
//     throw new Error(`Failed to send welcome email: ${err.message}`);
//   }
// };










// const transporter = require("../config/emailConfig");


// exports.sendWelcomeEmail = async ({ first_name, email }) => {
//   try {
//     await transporter.sendMail({
//       from: `"AAMS" <${process.env.EMAIL}>`,
//       to: email,
//       subject: "Welcome to AAMS 🎉",
//       html: `
//         <h2>Welcome, ${first_name}!</h2>
//         <p>Your account has been created successfully on <b>AAMS</b>.</p>
//         <p>You can now log in using your email: <b>${email}</b></p>
//       `,
//     });
//     console.log("✅ Welcome email sent to:", email);
//   } catch (err) {
//     console.error("❌ Error sending welcome email:", err);
//   }
// };













// const bcrypt = require("bcrypt");
// const { sql, getConnectionPool } = require("../config/db"); // Database connection
// const { AppError } = require("../middlewares/errorHandler");
// const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
// const {getDatawithPagination} = require("../utils/helper");
// const { addNotificationService } = require("./notificationService");
// const { sendWelcomeEmail } = require("./emailService"); // Import email service

// const fileTypeFromBuffer = async (buffer) => {
//     const fileType = await import('file-type');
//     return fileType.fileTypeFromBuffer(buffer);
// };

// exports.addUserToOrganizationService = async (org_id, userData, created_by) => {
//     const {username, first_name, last_name, email, phone_number, password, role_id, status_id} = userData;
//     try {
//         const pool = await getConnectionPool();
//         const saltRounds = 10;
//         const hashedPassword = await bcrypt.hash(password, saltRounds);

//          // 🔹 Set the session context for audit logs
//          await pool.request()
//          .input("app_user", sql.UniqueIdentifier, created_by)
//          .query("EXEC sp_set_session_context @key = 'app_user', @value = @app_user, @read_only = 0;");

//         // Get organization details for email
//         const orgResult = await pool.request()
//             .input("OrgID", sql.UniqueIdentifier, org_id)
//             .execute("GetOrganizationById"); // Assuming you have this stored procedure

//         const organizationData = orgResult.recordset[0] || {};

//         const result = await pool.request()
//             .input("OrgID", sql.UniqueIdentifier, org_id)
//             .input("UserName", sql.VarChar(50), username)
//             .input("FirstName", sql.VarChar(50), first_name)
//             .input("LastName", sql.VarChar(50), last_name)
//             .input("Email", sql.VarChar(50), email)
//             .input("PhoneNumber", sql.VarChar(20), phone_number)
//             .input("Password", sql.NVarChar(255), hashedPassword)
//             .input("RoleID", sql.Int, role_id) 
//             .input("StatusID", sql.Int, status_id) 
//             .input("CreatedBy", sql.UniqueIdentifier, created_by)
//             .execute("AddUserToOrganization");

//         // Get the created user ID from the result
//         const newUserId = result.recordset[0]?.user_id;

//         // Add notification to the admin who created the user
//         await addNotificationService(
//             created_by,
//             "User Added",
//             `User "${first_name} ${last_name}" has been added successfully!`,
//             "success"
//         );

//         // Add notification to the newly created user (welcome notification)
//         if (newUserId) {
//             await addNotificationService(
//                 newUserId,
//                 "Welcome!",
//                 `Welcome to the platform! Your account has been created successfully.`,
//                 "info"
//             );
//         }

//         // 🔹 Send welcome email to the new user
//         try {
//             const emailResult = await sendWelcomeEmail(
//                 email,
//                 { first_name, last_name },
//                 organizationData,
//                 { username, password } // Send plain password in email (consider security implications)
//             );

//             if (emailResult.success) {
//                 console.log(`Welcome email sent successfully to ${email}`);
                
//                 // Add notification about email being sent
//                 await addNotificationService(
//                     created_by,
//                     "Welcome Email Sent",
//                     `Welcome email has been sent to ${email}`,
//                     "info"
//                 );
//             } else {
//                 console.error(`Failed to send welcome email to ${email}:`, emailResult.error);
                
//                 // Add notification about email failure
//                 await addNotificationService(
//                     created_by,
//                     "Email Send Failed",
//                     `Failed to send welcome email to ${email}. Please inform the user manually.`,
//                     "warning"
//                 );
//             }
//         } catch (emailError) {
//             console.error("Email service error:", emailError);
//             // Don't throw error - user creation was successful, email is just a bonus feature
//         }

//         return result.recordset;
//     } catch (err) {
//         console.error("Error in addUserToOrganizationService:", err);

//         if (err.code === "EREQUEST" || err.code === "EPARAM") {
//             throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
//         }

//         throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
//     }
// };

// exports.editUserService = async (user_id, updatedData, modified_by) => {
//     const {first_name, last_name, email, phone_number, role_id} = updatedData;
//     try {
//         const pool = await getConnectionPool();

//          // 🔹 Set the session context for audit logs
//          await pool.request()
//          .input("app_user", sql.UniqueIdentifier, modified_by)
//          .query("EXEC sp_set_session_context @key = 'app_user', @value = @app_user, @read_only = 0;");

//         const result = await pool.request()
//             .input("UserID", sql.UniqueIdentifier, user_id)
//             .input("FirstName", sql.VarChar(50), first_name)
//             .input("LastName", sql.VarChar(50), last_name)
//             .input("Email", sql.VarChar(50), email)
//             .input("PhoneNumber", sql.VarChar(20), phone_number)
//             .input("RoleID", sql.Int, role_id) 
//             .input("ModifiedBy", sql.UniqueIdentifier, modified_by)
//             .execute("UpdateUser");

//         // Add notification to the admin who updated the user
//         await addNotificationService(
//             modified_by,
//             "User Updated",
//             `User "${first_name} ${last_name}" has been updated successfully!`,
//             "success"
//         );

//         // Add notification to the user whose details were updated
//         // Only if the user being updated is different from the one updating
//         if (user_id !== modified_by) {
//             await addNotificationService(
//                 user_id,
//                 "Profile Updated",
//                 `Your profile details have been updated.`,
//                 "info"
//             );
//         }

//         return result.recordset;
//     } catch (err) {
//         console.error("Error in editUserService:", err);

//         if (err.code === "EREQUEST" || err.code === "EPARAM") {
//             throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
//         }

//         throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
//     }
// };

// // ... rest of your existing functions remain the same ...

// exports.viewUserService = async (user_id) => {
// try{
//     const pool = await getConnectionPool();

//     const result = await pool.request()
//     .input("UserID", sql.UniqueIdentifier, user_id)
//     .execute("GetUserDetailsById");
//     if(!result.recordset.length){
//         throw {status: STATUS_CODES.NOT_FOUND, message: ERROR_MESSAGES.DATA_NOT_FOUND}
//       }
//     return result.recordset[0];
// }
// catch(err){
//     console.error("Database error:", err);

//     if (err.code === "EREQUEST" || err.code === "EPARAM") {
//         throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
//     }
//     throw new AppError(err.message, err.status);
// }
// }

// exports.deleteUserService = async(user_id, deleted_by) =>{
//     try{
//       const pool = await getConnectionPool();

//       // First get the user name for notification (optional)
//       const userInfo = await pool.request()
//         .input("UserID", sql.UniqueIdentifier, user_id)
//         .execute("GetUserDetailsById");
      
//       const userName = userInfo.recordset[0] 
//         ? `${userInfo.recordset[0].first_name} ${userInfo.recordset[0].last_name}` 
//         : "User";

//        // 🔹 Set the session context for audit logs
//        await pool.request()
//        .input("app_user", sql.UniqueIdentifier, deleted_by)
//        .query("EXEC sp_set_session_context @key = 'app_user', @value = @app_user, @read_only = 0;");

//       const result = await pool.request()
//       .input("UserID", sql.UniqueIdentifier, user_id)
//       .execute("DeleteUser");

//       // Add notification after successful user deletion
//       await addNotificationService(
//           deleted_by,
//           "User Deleted",
//           `User "${userName}" has been deleted successfully!`,
//           "warning"
//       );
  
//       return result.recordset;
  
//     }catch(err){
//       console.error(err);
//       if (err.code === 'EREQUEST' || err.code === 'EPARAM') {
//         throw new AppError(err.message, STATUS_CODES.BAD_REQUEST); // Database-level errors
//     }
//     throw new AppError("An expected error occured:"+ err.message,err.status);
//     }
//   }

// exports.getUsersService = async (org_id, pageNumber, pageSize) => {
//     try{
//         const pool = await getConnectionPool();
    
//         const result = await pool.request()
//         .input("OrgID", sql.UniqueIdentifier, org_id)
//         .input("PageNumber", sql.Int, pageNumber)
//         .input("PageSize", sql.Int, pageSize)
//         .execute("GetUsersByOrgId");
//         if(!result.recordset.length){
//             throw {status: STATUS_CODES.NOT_FOUND, message: ERROR_MESSAGES.DATA_NOT_FOUND}
//           }
//           return getDatawithPagination(result.recordsets);
//     }
//     catch(err){
//         console.error("Database error:", err);
//         if (err.code === "EREQUEST" || err.code === "EPARAM") {
//             throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
//         }
//         throw new AppError(err.message, err.status);
//     }
//     }

// exports.updateUserStatusService = async (user_id, status_id, updated_by) => {
        
//         try {
//             const pool = await getConnectionPool();

//             // Get user details for notification
//             const userInfo = await pool.request()
//                 .input("UserID", sql.UniqueIdentifier, user_id)
//                 .execute("GetUserDetailsById");
            
//             const userName = userInfo.recordset[0] 
//                 ? `${userInfo.recordset[0].first_name} ${userInfo.recordset[0].last_name}` 
//                 : "User";

//             const result = await pool.request()
//                 .input("UserID", sql.UniqueIdentifier, user_id)
//                 .input("StatusID", sql.Int, status_id)
//                 .execute("UpdateUserStatus");

//             // Determine status text for notification
//             const statusText = status_id === 1 ? "activated" : "deactivated";

//             // Add notification to admin who updated the status
//             if (updated_by) {
//                 await addNotificationService(
//                     updated_by,
//                     "User Status Updated",
//                     `User "${userName}" has been ${statusText} successfully!`,
//                     "info"
//                 );
//             }

//             // Add notification to the user whose status was updated
//             // Only if the user being updated is different from the one updating
//             if (user_id !== updated_by) {
//                 await addNotificationService(
//                     user_id,
//                     "Account Status Changed",
//                     `Your account has been ${statusText}.`,
//                     status_id === 1 ? "success" : "warning"
//                 );
//             }
    
//             return result.recordset;
//         } catch (err) {
//             console.error("Error in updateUserStatusService", err);
    
//             if (err.code === "EREQUEST" || err.code === "EPARAM") {
//                 throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
//             }
    
//             throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
//         }
//     };

// exports.uploadImageService = async(user_id, user_image)=>{
//         try{
//       const pool = await getConnectionPool()
//       const result = await pool.request()
//       .input("UserID", sql.UniqueIdentifier, user_id)
//       .input("UserImage", sql.VarBinary(sql.MAX), user_image)
//       .query(`UPDATE Users
//       set user_image = @UserImage
//       where user_id = @UserID`)

//       if (result.rowsAffected[0] === 0) {
//         throw new AppError("No user found or update failed", STATUS_CODES.NOT_FOUND);
//       }

//       // Add notification for image upload
//       await addNotificationService(
//           user_id,
//           "Profile Picture Updated",
//           "Your profile picture has been updated successfully!",
//           "success"
//       );
  
//       return {
//         message: "User image updated successfully!",
//       };
//         }catch(err){
//           console.error("Database error:", err);
//             if (err.code === "EREQUEST" || err.code === "EPARAM") {
//                 throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
//             }
//             throw new AppError(err.message, err.status);
//         }
//         }

// exports.getImageService = async(user_id)=>{
//     try{
//    const pool = await getConnectionPool()
//    const result = await pool.request()
//    .input("UserID", sql.UniqueIdentifier, user_id)
//    .query(`SELECT user_image from Users where user_id = @UserID`)

//    const imageBuffer = result.recordset[0]?.user_image;
//    if (!imageBuffer) {
//     throw new AppError("No image found", STATUS_CODES.NOT_FOUND);
//   }

//   // Use file-type to detect the MIME type from the buffer
//   const typeInfo = await fileTypeFromBuffer(imageBuffer);
//   const mimeType = typeInfo?.mime || 'image/jpeg'; // fallback to JPEG

//      return{imageBuffer, mimeType} 

//     }catch(err){
//         if (err.code === "EREQUEST" || err.code === "EPARAM") {
//             throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
//         }
//         throw new AppError(err.message, err.status);
//     }
// }

// exports.deleteImageService = async(user_id)=>{
//     try{
//   const pool = await getConnectionPool()
//   const result = await pool.request()
//   .input("UserID", sql.UniqueIdentifier, user_id)
//   .query(`UPDATE Users
//   set user_image = NULL
//   where user_id = @UserID`)

//   if (result.rowsAffected[0] === 0) {
//     throw new AppError("No user found or delete failed", STATUS_CODES.NOT_FOUND);
//   }

//   // Add notification for image deletion
//   await addNotificationService(
//       user_id,
//       "Profile Picture Removed",
//       "Your profile picture has been removed successfully!",
//       "info"
//   );

//   return {
//     message: "User image deleted successfully!",
//   };
//     }catch(err){
//       console.error("Database error:", err);
//         if (err.code === "EREQUEST" || err.code === "EPARAM") {
//             throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
//         }
//         throw new AppError(err.message, err.status);
//     }
//     }













// // emailService.js - Create this new service file

// const nodemailer = require('nodemailer');
// const { AppError } = require("../middlewares/errorHandler");
// const { STATUS_CODES } = require("../utils/errorCodes");

// // Email configuration - You can move these to environment variables
// const EMAIL_CONFIG = {
//     host: process.env.SMTP_HOST || 'smtp.gmail.com',
//     port: process.env.SMTP_PORT || 587,
//     secure: false, // true for 465, false for other ports
//     auth: {
//         user: process.env.EMAIL_USER || 'your-admin-email@gmail.com',
//         pass: process.env.EMAIL_PASSWORD || 'your-app-password'
//     }
// };

// // Create transporter
// const transporter = nodemailer.createTransport(EMAIL_CONFIG);

// // Verify connection configuration
// transporter.verify(function(error, success) {
//     if (error) {
//         console.log('Email configuration error:', error);
//     } else {
//         console.log('Email server is ready to take our messages');
//     }
// });

// /**
//  * Send welcome email to newly created user
//  */
// exports.sendWelcomeEmail = async (userDetails, organizationDetails) => {
//     try {
//         const { 
//             email, 
//             first_name, 
//             last_name, 
//             username, 
//             password, // This should be the plain password before hashing
//             role_name 
//         } = userDetails;

//         const { 
//             org_name, 
//             contact_first_name, 
//             contact_last_name, 
//             contact_email 
//         } = organizationDetails;

//         const fullName = `${first_name} ${last_name}`;
//         const adminName = `${contact_first_name} ${contact_last_name}`;

//         const emailHtml = `
//         <!DOCTYPE html>
//         <html lang="en">
//         <head>
//             <meta charset="UTF-8">
//             <meta name="viewport" content="width=device-width, initial-scale=1.0">
//             <title>Welcome to ${org_name}</title>
//             <style>
//                 body {
//                     font-family: Arial, sans-serif;
//                     line-height: 1.6;
//                     margin: 0;
//                     padding: 0;
//                     background-color: #f4f4f4;
//                 }
//                 .container {
//                     max-width: 600px;
//                     margin: 0 auto;
//                     padding: 20px;
//                     background-color: #ffffff;
//                     border-radius: 10px;
//                     box-shadow: 0 0 10px rgba(0,0,0,0.1);
//                 }
//                 .header {
//                     background-color: #007bff;
//                     color: white;
//                     padding: 20px;
//                     text-align: center;
//                     border-radius: 10px 10px 0 0;
//                 }
//                 .content {
//                     padding: 30px;
//                 }
//                 .credentials-box {
//                     background-color: #f8f9fa;
//                     border-left: 4px solid #007bff;
//                     padding: 20px;
//                     margin: 20px 0;
//                     border-radius: 5px;
//                 }
//                 .footer {
//                     text-align: center;
//                     padding: 20px;
//                     background-color: #f8f9fa;
//                     border-radius: 0 0 10px 10px;
//                     font-size: 12px;
//                     color: #666;
//                 }
//                 .button {
//                     display: inline-block;
//                     padding: 12px 24px;
//                     background-color: #007bff;
//                     color: white;
//                     text-decoration: none;
//                     border-radius: 5px;
//                     margin: 10px 0;
//                 }
//                 .warning {
//                     background-color: #fff3cd;
//                     border-left: 4px solid #ffc107;
//                     padding: 15px;
//                     margin: 20px 0;
//                     border-radius: 5px;
//                 }
//             </style>
//         </head>
//         <body>
//             <div class="container">
//                 <div class="header">
//                     <h1>Welcome to ${org_name}!</h1>
//                 </div>
                
//                 <div class="content">
//                     <h2>Hello ${fullName},</h2>
                    
//                     <p>Welcome aboard! Your account has been successfully created by <strong>${adminName}</strong> for <strong>${org_name}</strong>.</p>
                    
//                     <p>You have been assigned the role of <strong>${role_name}</strong> in the organization.</p>
                    
//                     <div class="credentials-box">
//                         <h3>🔐 Your Login Credentials:</h3>
//                         <p><strong>Username:</strong> ${username}</p>
//                         <p><strong>Email:</strong> ${email}</p>
//                         <p><strong>Temporary Password:</strong> ${password}</p>
//                     </div>
                    
//                     <div class="warning">
//                         <h4>⚠️ Important Security Notice:</h4>
//                         <p>For security reasons, please log in and change your password immediately after your first login. Keep your credentials confidential and do not share them with anyone.</p>
//                     </div>
                    
//                     <p>You can now access the platform using these credentials. If you have any questions or need assistance, please don't hesitate to reach out to your administrator.</p>
                    
//                     <center>
//                         <a href="${process.env.LOGIN_URL || '#'}" class="button">Login to Platform</a>
//                     </center>
                    
//                     <p>Best regards,<br>
//                     <strong>${adminName}</strong><br>
//                     ${org_name}<br>
//                     Email: ${contact_email}</p>
//                 </div>
                
//                 <div class="footer">
//                     <p>This is an automated email. Please do not reply to this email address.</p>
//                     <p>If you did not expect this email, please contact your system administrator immediately.</p>
//                 </div>
//             </div>
//         </body>
//         </html>
//         `;

//         const mailOptions = {
//             from: {
//                 name: `${adminName} - ${org_name}`,
//                 address: process.env.EMAIL_USER || contact_email
//             },
//             to: email,
//             cc: contact_email, // CC the admin who created the user
//             subject: `Welcome to ${org_name} - Account Created Successfully`,
//             html: emailHtml,
//             text: `
// Welcome to ${org_name}!

// Hello ${fullName},

// Your account has been successfully created by ${adminName} for ${org_name}.
// You have been assigned the role of ${role_name}.

// Your Login Credentials:
// Username: ${username}
// Email: ${email}
// Temporary Password: ${password}

// IMPORTANT: Please log in and change your password immediately for security reasons.

// Best regards,
// ${adminName}
// ${org_name}
// Email: ${contact_email}
//             `
//         };

//         const info = await transporter.sendMail(mailOptions);
//         console.log('Welcome email sent successfully:', info.messageId);
        
//         return {
//             success: true,
//             messageId: info.messageId,
//             message: 'Welcome email sent successfully'
//         };

//     } catch (error) {
//         console.error('Error sending welcome email:', error);
//         // Don't throw error to prevent user creation from failing
//         // Just log the error and continue
//         return {
//             success: false,
//             error: error.message,
//             message: 'Failed to send welcome email'
//         };
//     }
// };

// /**
//  * Send notification email to admin when user is created
//  */
// exports.sendAdminNotificationEmail = async (userDetails, adminDetails) => {
//     try {
//         const { first_name, last_name, email, username, role_name } = userDetails;
//         const { admin_email, admin_name, org_name } = adminDetails;

//         const mailOptions = {
//             from: process.env.EMAIL_USER,
//             to: admin_email,
//             subject: `New User Created - ${org_name}`,
//             html: `
//             <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//                 <h2>New User Created Successfully</h2>
//                 <p>Hello ${admin_name},</p>
//                 <p>A new user has been successfully created in your organization:</p>
                
//                 <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
//                     <h3>User Details:</h3>
//                     <p><strong>Name:</strong> ${first_name} ${last_name}</p>
//                     <p><strong>Username:</strong> ${username}</p>
//                     <p><strong>Email:</strong> ${email}</p>
//                     <p><strong>Role:</strong> ${role_name}</p>
//                 </div>
                
//                 <p>The user has been sent welcome email with login credentials.</p>
                
//                 <p>Best regards,<br>System Administrator</p>
//             </div>
//             `
//         };

//         const info = await transporter.sendMail(mailOptions);
//         console.log('Admin notification email sent:', info.messageId);
        
//         return { success: true, messageId: info.messageId };
//     } catch (error) {
//         console.error('Error sending admin notification email:', error);
//         return { success: false, error: error.message };
//     }
// };