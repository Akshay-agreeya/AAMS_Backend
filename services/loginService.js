const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const { sql, getConnectionPool } = require("../config/db");
const { generateToken } = require('../utils/jwUtils');
const {sendEmail} = require('../utils/emailUtils');
const { ERROR_MESSAGES, STATUS_CODES } = require("../utils/errorCodes");
const { AppError } = require("../middlewares/errorHandler");


exports.userLoginService = async (email, password) => {
    try {
        const pool = await getConnectionPool();
        const result = await pool.request()
            .input("Email", sql.VarChar(50), email)
            .execute("UserLogin");

        if (result.recordset[0].ErrorMessage) {
            throw new AppError(result.recordset[0].ErrorMessage, STATUS_CODES.UNAUTHORIZED);
        }
        if (!result || !result.recordset) {
            throw new AppError(ERROR_MESSAGES.INVALID_EMAIL, STATUS_CODES.NOT_FOUND);
        }
        
        const user = result.recordset[0];

        // Ensure password_hash exists before comparing
        if (!user.password_hash) {
            throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, STATUS_CODES.UNAUTHORIZED);
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, STATUS_CODES.UNAUTHORIZED);
        }

        // Generate JWT token
        const token = generateToken(user.user_id);

        return {
            id: user.user_id,
            first_name: user.first_name,
            last_name: user.last_name,
            user_type: user.user_type,
            user_role: user.user_role,
            role_id: user.role_id,
            token
        };
    } catch (error) {
        console.error("Login error:", error);
        throw new AppError(error.message, error.status);
    }
};

// exports.forgotAndResetPasswordService = async(email, password) =>{
//     const saltRounds = 10;
//     const hashedPassword = await bcrypt.hash(password, saltRounds);
//     try{
//         const pool = await getConnectionPool();
//         const result = await pool.request()
//         .input("Email", sql.VarChar(50), email)
//         .input("NewPasswordHash", sql.VarChar(255),hashedPassword)
//         .execute("ForgotPasswordAndReset");

//       if(!result.recordset[0].user_id){
//         throw { status: STATUS_CODES.NOT_FOUND, message: ERROR_MESSAGES.USER_NOT_FOUND };
//       }
        
//         return result.recordset;

// }catch (err) {
//     console.error('Error in ForgotAndResetPasswordService', err);

//     if (err.code === 'EREQUEST') {
//         throw new AppError(err.message, STATUS_CODES.BAD_REQUEST); // Database-level errors
//     }

//     throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
// }
// }

exports.changePasswordService = async (user_id, oldPassword, newPassword) => {
    const saltRounds = 10;
    
    try {
        const pool = await getConnectionPool();
        
        // Fetch stored password hash for validation
        const userResult = await pool.request()
            .input("UserID", sql.UniqueIdentifier, user_id)
            .query("SELECT password FROM User_Authentication WHERE user_id = @UserID");

        if (!userResult.recordset.length || !userResult.recordset[0].password) {
            throw new AppError("User not found", STATUS_CODES.NOT_FOUND);
        }

        const storedPasswordHash = userResult.recordset[0].password;

        // Compare old password with stored hash using bcrypt
        const isOldPasswordValid = await bcrypt.compare(oldPassword, storedPasswordHash);
        if (!isOldPasswordValid) {
            throw new AppError("Old password is incorrect", STATUS_CODES.UNAUTHORIZED);
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Execute stored procedure to update password
        const result = await pool.request()
            .input("UserID", sql.UniqueIdentifier, user_id)
            .input("NewPasswordHash", sql.VarChar(255), hashedPassword)
            .execute("ChangePassword");

        if (!result.recordset.length) {
            throw new AppError("Password change failed", STATUS_CODES.BAD_REQUEST);
        }

        return {
            message: "Password successfully changed.",
            user_id: result.recordset[0].user_id
        };

    } catch (err) {
        console.error("Error in ChangePasswordService", err);

        if (err.code === "EREQUEST") {
            throw new AppError(err.message, STATUS_CODES.BAD_REQUEST);
        }

        throw new AppError(err.message, err.status);

    }
};

exports.forgotPasswordService = async (email) => {
    try {
      const pool = await getConnectionPool();
  
      // Check if user exists
      const userResult = await pool
        .request()
        .input('Email', sql.NVarChar, email)
        .query('SELECT user_id, username FROM Users WHERE email = @Email');
  
      if (userResult.recordset.length === 0) {
        return { message: 'If the email exists, a reset link has been sent.' };
      }
  
      const { user_id: userId, username: userName } = userResult.recordset[0];
  
      // Invalidate old tokens
      await pool
        .request()
        .input('UserId', sql.UniqueIdentifier, userId)
        .query('DELETE FROM Password_Reset_Tokens WHERE user_id = @UserId');
  
      // Generate a new token
      const token = generateToken(userId);
      const expiresAt = new Date(Date.now() + 3600000); // 1-hour expiration
  
      // Store the reset token
      await pool
        .request()
        .input('UserId', sql.UniqueIdentifier, userId)
        .input('Token', sql.NVarChar, token)
        .input('ExpiresAt', sql.DateTime, expiresAt)
        .execute('AddResetToken');
  
      const resetUrl = `http://localhost:8080/api/reset-password?token=${token}`;
  
      // Send email
      await sendEmail(email, 'Password Reset Request',
       `Hi ${userName || 'User'},\n\nClick the link to reset your password: ${resetUrl}`);
  
      return { message: 'If the email exists, a reset link has been sent.' };
    } catch (error) {
      console.error('Error in forgotPasswordService:', error);
      throw new AppError(error.message, error.status);
    }
  };

exports.resetPasswordService = async (token, newPassword) => {
  
    try {
      const pool = await getConnectionPool();
  
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
  
      } catch (err) {
        console.log(decoded, err);
        throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, STATUS_CODES.UNAUTHORIZED);
      }
  
      const userId = decoded.id;
  
      // Check if the token exists and is valid
      const tokenResult = await pool.request()
        .input('UserId', sql.UniqueIdentifier, userId)
        .input('Token', sql.NVarChar, token)
        .query(
          `SELECT * 
           FROM Password_Reset_Tokens 
           WHERE user_id = @UserId 
             AND token = @Token 
             AND expires_at > GETUTCDATE()` 
        );
  
      if (tokenResult.recordset.length === 0) {
        console.log(tokenResult);
        throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, STATUS_CODES.UNAUTHORIZED);

      }
  
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
  
      // Update the user's password
      await pool
        .request()
        .input('UserId', sql.UniqueIdentifier, userId)
        .input('HashedPassword', sql.NVarChar, hashedPassword)
        .query(`BEGIN TRANSACTION;
        UPDATE User_Authentication
        SET password = @HashedPassword
        WHERE user_id = @UserId;
        COMMIT TRANSACTION;
        `);
  
      // Delete the reset token after successful password reset
      await pool
        .request()
        .input('UserId', sql.UniqueIdentifier, userId)
        .input('Token', sql.NVarChar, token)
        .query(
          'DELETE FROM Password_Reset_Tokens WHERE user_id = @UserId AND token = @Token'
        );

      return { message: 'Password has been reset successsfully.'};

    } catch (error) {
      console.error('Error in resetPasswordService:', error);
      throw new AppError(error.message, error.status);
    }
  };
  
  


