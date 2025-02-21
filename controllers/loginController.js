const {userLoginService, forgotAndResetPasswordService, changePasswordService} = require('../services/loginService');
const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const {SUCCESS_MESSAGES } = require('../utils/responseMessages');
const {SuccessReturnHandler} = require('../middlewares/responseHandler');

exports.userLoginController = 
    async (req, res, next) => {
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

exports.forgotAndResetPasswordController = async(req,res,next)=>{
const {email, password} = req.body;
try{
    const user = await forgotAndResetPasswordService(email, password);
    const successResponse = SuccessReturnHandler({
        message: SUCCESS_MESSAGES.PASSWORD_RESET,
        resp: user,
    });
    return res.status(STATUS_CODES.SUCCESS).json(successResponse);
} catch(err){
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
