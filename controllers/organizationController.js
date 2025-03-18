const { addOrganizationService, getOrganizationByIdService, editOrgService, deleteOrgService, getOrganizationsService} = require("../services/organizationService");
const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const {SUCCESS_MESSAGES } = require('../utils/responseMessages');
const { SuccessReturnHandler } = require("../middlewares/responseHandler");
const {AppError} = require("../middlewares/errorHandler")

exports.addOrganizationController = async (req, res, next) => {
    try {
        const orgData = req.body;
        const created_by = req.user?.id;

        if (!created_by) {
            return res.status(STATUS_CODES.UNAUTHORIZED).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
        }

        const org = await addOrganizationService(orgData, created_by);
        const successResponse = SuccessReturnHandler({
            message: SUCCESS_MESSAGES.DETAILS_ADD_SUCCESS,
            resp:org,
        });
        return res.status(STATUS_CODES.SUCCESS).json(successResponse);

    } catch (err) {
        next(err);
    }
};

exports.getOrganizationByIdController = async(req,res,next) =>{
    const {org_id} = req.body;
    const { page, size } = req.query;
    
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(size, 10) || 5;

    try{
        const orgDetails = await getOrganizationByIdService(org_id, pageNumber, pageSize);

        const successResponse = SuccessReturnHandler({
            message : SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
            resp: orgDetails,
        });
        res.status(STATUS_CODES.SUCCESS).json(successResponse);
    }catch(err){
        next(err);
    }
}

exports.editOrganizationController = async (req, res, next) => {
    try {
        const {org_id} = req.params;
        const orgData = req.body;
        const modified_by = req.user?.id;

        if (!modified_by) {
            return res.status(STATUS_CODES.UNAUTHORIZED).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
        }

        const org = await editOrgService(org_id, orgData, modified_by);
        const successResponse = SuccessReturnHandler({
            message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
            resp: org,
        });
        return res.status(STATUS_CODES.SUCCESS).json(successResponse);

    } catch (err) {
       next(err);
    }
};


exports.deleteOrgController = async (req, res, next) => {
    let { org_ids } = req.body; // Expecting an array of org_ids
  const deleted_by = req.user?.id;

    try {
      if (!org_ids || !Array.isArray(org_ids) || org_ids.length === 0) {
        throw new AppError("At least one org_id is required", STATUS_CODES.BAD_REQUEST);
      }
  
      const message = await deleteOrgService(org_ids, deleted_by);
  
      const successResponse = SuccessReturnHandler({
        message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
        resp:  message,
      });
  
      return res.status(STATUS_CODES.SUCCESS).json(successResponse);
    } catch (err) {
      next(err);
    }
  };
  

exports.getOrganizationsController = async (req, res, next) => {
    const { page, size } = req.query;
    
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(size, 10) || 5;

    try {
        const data = await getOrganizationsService(pageNumber, pageSize);
        
        return res.status(STATUS_CODES.SUCCESS).json({
            success: true,
            message: "Organizations retrieved successfully",
            ...data
        });

    } catch (err) {
        next(err);
    }
};
