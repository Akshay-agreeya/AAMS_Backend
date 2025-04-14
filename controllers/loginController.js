const {userLoginService, changePasswordService, forgotPasswordService, resetPasswordService} = require('../services/loginService');
const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const {SUCCESS_MESSAGES } = require('../utils/responseMessages');
const {generateToken} = require('../utils/jwUtils')
const {SuccessReturnHandler} = require('../middlewares/responseHandler');
const dotenv = require('dotenv');
const { AppError } = require('../middlewares/errorHandler');
const jwt = require('jsonwebtoken');
dotenv.config();

exports.userLoginController = async (req, res, next) => {
        const { email, password} = req.body;
        try {
            const user = await userLoginService(email, password);
            const successResponse = SuccessReturnHandler({
                message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
                resp: user,
            });
            return res.status(STATUS_CODES.SUCCESS).json(successResponse);
           
        } catch (err) {
            next(err)
        }
    };

exports.changePasswordController = async(req, res, next)=>{
   const user_id = req.user?.id;
    const {oldPassword, newPassword} = req.body;
    try{
        const user = await changePasswordService(user_id, oldPassword, newPassword);
        const successResponse = SuccessReturnHandler({
            message: SUCCESS_MESSAGES.PASSWORD_CHANGE,
            resp: user,
        });
        return res.status(STATUS_CODES.SUCCESS).json(successResponse);
    } catch(err){
        next(err)
    }
}

exports.forgotPasswordController = async (req, res, next) => {
  const { email } = req.body;

  try {
    const response = await forgotPasswordService(email);
    const successResponse = SuccessReturnHandler({
                message: SUCCESS_MESSAGES.FORGOT_PASSWORD,
                resp: response,
            });
    return res.status(STATUS_CODES.SUCCESS).json(successResponse);

  } catch (error) {
    next(error); 
  }
};

exports.resetPasswordController = async (req, res, next) => {
    const { token } = req.query;
    const {newPassword} = req.body;
  
    try {
      const response = await resetPasswordService(token, newPassword);
      const successResponse = SuccessReturnHandler({
                  message: SUCCESS_MESSAGES.PASSWORD_RESET,
                  resp: response,
              });
      return res.status(STATUS_CODES.SUCCESS).json(successResponse);
  
    } catch (error) {
      next(error); 
    }
  };

 exports.refreshAccessToken = (req, res) => {
    const { refreshToken } = req.body;
  
    if (!refreshToken) 
    return res.status(STATUS_CODES.UNAUTHORIZED).json({ message: 'Refresh token missing' });
  
    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
      const newAccessToken = generateToken(decoded.id);
      return res.status(STATUS_CODES.SUCCESS).json({ token: newAccessToken });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(STATUS_CODES.FORBIDDEN).json({ message: 'Refresh Token expired' });
      }
  
      if (err.name === 'JsonWebTokenError') {
        return res.status(STATUS_CODES.FORBIDDEN).json({ message: 'Invalid refresh token' });
      }
      return res.status(STATUS_CODES.UNAUTHORIZED).json({ message: ERROR_MESSAGES.INVALID_CREDENTIALS });
    }
  };
