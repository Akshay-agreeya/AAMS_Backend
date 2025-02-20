const { addUserToOrganizationService, editUserService, viewUserService } = require("../services/userService");
const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const {SUCCESS_MESSAGES } = require('../utils/responseMessages');
const { SuccessReturnHandler } = require("../middlewares/responseHandler");

exports.addUserToOrganizationController = async (req, res, next) => {
    try {
        const {org_id} = req.params;
        const userData = req.body;
        const created_by = req.user?.id; 

        if (!created_by) {
            return res.status(STATUS_CODES.UNAUTHORIZED).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
        }

        const user = await addUserToOrganizationService(org_id, userData, created_by);
        const successResponse = SuccessReturnHandler({
            message: SUCCESS_MESSAGES.DETAILS_ADD_SUCCESS,
            resp: user,
        });
        return res.status(STATUS_CODES.SUCCESS).json(successResponse);
    } catch (err) {
        next(err);
    }
};

exports.editUserCntroller = async (req, res, next) => {
    try {
        const {user_id} = req.params;
        const updatedData = req.body;
        const modified_by = req.user?.id; 

        if (!modified_by) {
            return res.status(STATUS_CODES.UNAUTHORIZED).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
        }

        const updatedUser = await editUserService(user_id, updatedData, modified_by);
        const successResponse = SuccessReturnHandler({
            message: SUCCESS_MESSAGES.UPDATE_SUCCESS,
            resp: updatedUser,
        });
        return res.status(STATUS_CODES.SUCCESS).json(successResponse);
    } catch (err) {
        next(err);
    }
};

exports.viewUserController = async(req,res,next) =>{
    const {user_id} = req.params;
    try{
        const userDetails = await viewUserService(user_id);

        const successResponse = SuccessReturnHandler({
            message : SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
            resp: userDetails,
        });
        res.status(STATUS_CODES.SUCCESS).json(successResponse);
    }catch(err){
        next(err);
    }
}