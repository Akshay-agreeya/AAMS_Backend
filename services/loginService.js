const bcrypt = require("bcrypt");
const { sql, getConnectionPool } = require("../config/db");
const { generateToken } = require('../utils/jwUtils');
const { ERROR_MESSAGES, STATUS_CODES } = require("../utils/errorCodes");
const { AppError } = require("../middlewares/errorHandler");

exports.userLoginService = async (email, password) => {
    try {
        const pool = await getConnectionPool();
    
          const result = await pool.request()
                .input("Email", sql.VarChar(50), email)
                .execute("UserLogin");
        
        if (!result.recordset.length) {
            throw { status: STATUS_CODES.NOT_FOUND, message: ERROR_MESSAGES.USER_NOT_FOUND };
        }

        const user = result.recordset[0];

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            throw { status: STATUS_CODES.UNAUTHORIZED, message: ERROR_MESSAGES.INVALID_CREDENTIALS };
        }

        // Generate JWT token
        const token = generateToken(user.user_id);

        return {
            id: user.user_id,
            first_name: user.first_name,
            last_name: user.last_name,
            user_type: user.user_type,
            user_role:user.user_role,
            token
        };
    } catch (error) {
        console.error("Login error:", error);
        throw new AppError(error.message, STATUS_CODES.BAD_REQUEST);
    }
};

exports.forgotAndResetPasswordService = async(email, password) =>{
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    try{
        const pool = await getConnectionPool();
        const result = await pool.request()
        .input("Email", sql.VarChar(50), email)
        .input("NewPasswordHash", sql.VarChar(255),hashedPassword)
        .execute("ForgotPasswordAndReset");

      if(!result.recordset[0].user_id){
        throw { status: STATUS_CODES.NOT_FOUND, message: ERROR_MESSAGES.USER_NOT_FOUND };
      }
        
        return result.recordset;

}catch (err) {
    console.error('Error in ForgotAndResetPasswordService', err);

    if (err.code === 'EREQUEST') {
        throw new AppError(err.message, STATUS_CODES.BAD_REQUEST); // Database-level errors
    }

    throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
}
}


exports.changePasswordService = async (user_id, oldPassword, newPassword) => {
    const saltRounds = 10;
    
    try {
        const pool = await getConnectionPool();
        
        // Fetch stored password hash for validation
        const userResult = await pool.request()
            .input("UserID", sql.UniqueIdentifier, user_id)
            .query("SELECT password FROM User_Authentication WHERE user_id = @UserID");

        if (!userResult.recordset.length) {
            throw new AppError("User not found.", STATUS_CODES.NOT_FOUND);
        }

        const storedPasswordHash = userResult.recordset[0].password;

        // Compare old password with stored hash using bcrypt
        const isOldPasswordValid = await bcrypt.compare(oldPassword, storedPasswordHash);
        if (!isOldPasswordValid) {
            throw new AppError("Old password is incorrect.", STATUS_CODES.UNAUTHORIZED);
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Execute stored procedure to update password
        const result = await pool.request()
            .input("UserID", sql.UniqueIdentifier, user_id)
            .input("NewPasswordHash", sql.VarChar(255), hashedPassword)
            .execute("ChangePassword");

        if (!result.recordset.length) {
            throw new AppError("Password change failed.", STATUS_CODES.BAD_REQUEST);
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

        throw new AppError(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
};

