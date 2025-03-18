const { SuccessReturnHandler } = require('../middlewares/responseHandler');
const {getRolesService, addRoleAndDetailsService, updateRoleAndDetailsService, getRoleWithDetailsService, deleteRoleService } = require('../services/roleService');
const { STATUS_CODES } = require('../utils/errorCodes');
const { SUCCESS_MESSAGES } = require('../utils/responseMessages');

exports.getRolesController = async(req,res,next)=>{
  const { page, size } = req.query;

    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(size, 10) || 5;
    try{
        const roleNames = await getRolesService(pageNumber, pageSize);

        const successResponse = SuccessReturnHandler({
            message: SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
            resp: roleNames,
        });
        res.status(STATUS_CODES.SUCCESS).json(successResponse);

    }catch(error){
        next(error);
    }
};

exports.addRoleAndDetailsController = async(req,res,next)=>{
    const created_by = req.user?.id; 
    const roleDetails = req.body;
    try{
     const roleResponse = await addRoleAndDetailsService(roleDetails, created_by);
  
     const response = SuccessReturnHandler({
       message: SUCCESS_MESSAGES.DETAILS_ADD_SUCCESS,
       resp: roleResponse
     });
     res.status(STATUS_CODES.CREATED).json(response)
    }
    catch(err){
      next(err);
    }
  }

exports.updateRoleAndDetailsController = async(req,res,next) =>{
    const {role_id} = req.params;
    const roleDetails = req.body;
    const modified_by = req.user?.id; 
  
    try{
     const updatedRoleAndDetails = await updateRoleAndDetailsService(role_id, roleDetails, modified_by);
     const response = SuccessReturnHandler({
      message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
      resp:  updatedRoleAndDetails
  });
  
  res.status(STATUS_CODES.SUCCESS).json(response);
  
    }catch(err){
     next(err);
    }
  }

  exports.getRoleWithDetailsController = async(req,res,next) =>{
    const {role_id} = req.params;
  
    try{
     const roleData = await getRoleWithDetailsService(role_id);
     const response = SuccessReturnHandler({
      message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
      resp:roleData
  });
  
  res.status(STATUS_CODES.SUCCESS).json(response);
  
    }catch(err){
     next(err);
    }
  }
  
  exports.deleteRoleController = async(req,res,next) =>{
    const {role_id} = req.params;
    const deleted_by = req.user?.id;
    try{
        if(!role_id){
            throw new AppError("role_id is required", STATUS_CODES.BAD_REQUEST);
        }

        const message = await deleteRoleService(role_id, deleted_by);

        const successResponse = SuccessReturnHandler({
            message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
            resp:  message,
        })
        return res.status(STATUS_CODES.SUCCESS).json(successResponse);
    }catch(err){
        next(err);
    }
}