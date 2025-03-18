const { addUserToOrganizationService, editUserService, viewUserService, deleteUserService, getUsersService, updateUserStatusService } = require("../services/userService");
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
            resp: {content: user},
        });
        return res.status(STATUS_CODES.SUCCESS).json(successResponse);
    } catch (err) {
        next(err);
    }
};

exports.editUserController = async (req, res, next) => {
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
            resp: {content: updatedUser},
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
            resp:  userDetails,
        });
        res.status(STATUS_CODES.SUCCESS).json(successResponse);
    }catch(err){
        next(err);
    }
}

exports.deleteUserController = async(req,res,next) =>{
    const {user_id} = req.params;
    const deleted_by = req.user?.id;
    try{
        if(!user_id){
            throw new AppError("user_id is required", STATUS_CODES.BAD_REQUEST);
        }

        const message = await deleteUserService(user_id, deleted_by);

        const successResponse = SuccessReturnHandler({
            message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
            resp: message,
        })
        return res.status(STATUS_CODES.SUCCESS).json(successResponse);
    }catch(err){
        next(err);
    }
}

exports.getUsersController = async(req,res,next) =>{
    const {org_id} = req.params;
    const { page, size } = req.query;
    
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(size, 10) || 10;
    try{
        const users = await getUsersService(org_id, pageNumber, pageSize);

        const successResponse = SuccessReturnHandler({
            message : SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
            resp: users,
        });
        res.status(STATUS_CODES.SUCCESS).json(successResponse);
    }catch(err){
        next(err);
    }
}

exports.updateUserStatusController = async (req, res, next) => {
    try {
        const {user_id, status_id} = req.body;

        const updatedStatus = await updateUserStatusService(user_id, status_id);
        const successResponse = SuccessReturnHandler({
            message: SUCCESS_MESSAGES.UPDATE_SUCCESS,
            resp: {content: updatedStatus},
        });
        return res.status(STATUS_CODES.SUCCESS).json(successResponse);
    } catch (err) {
        next(err);
    }
};