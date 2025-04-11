const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const {SUCCESS_MESSAGES } = require('../utils/responseMessages');
const { SuccessReturnHandler } = require("../middlewares/responseHandler");
const { getPermissionService, updateUserPermissionService} = require("../services/permissionService");

exports.getPermissionController = async(req,res,next) =>{
    const {org_id} = req.params;
    try{
        const permissionDetails = await getPermissionService(org_id);

        const successResponse = SuccessReturnHandler({
            message : SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
            resp: permissionDetails,
        });
        res.status(STATUS_CODES.SUCCESS).json(successResponse);
    }catch(err){
        next(err);
    }
}


exports.updateUserPermissionController = async(req,res,next) =>{
    const { usersWithServices} = req.body;
    const performed_by = req.user?.id;
    try{

        const updatedPermissions = await updateUserPermissionService(usersWithServices, performed_by);

        const successResponse = SuccessReturnHandler({
            message : SUCCESS_MESSAGES.UPDATE_SUCCESS,
            resp: updatedPermissions,
        });
        res.status(STATUS_CODES.SUCCESS).json(successResponse);
    }catch(err){
        next(err);
    }
}

