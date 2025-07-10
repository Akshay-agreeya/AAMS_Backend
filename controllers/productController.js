const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const {SUCCESS_MESSAGES } = require('../utils/responseMessages');
const { SuccessReturnHandler } = require("../middlewares/responseHandler");
const {addProductService, updateProductService, viewProductService, getProductsService, deleteProductService, myProductsService, addMobileProductService, updateMobileProductService} = require("../services/productService")

exports.addProductController = async (req, res, next) => {
    try {
        const {org_id} = req.params;
        const serviceData = req.body;
        const created_by = req.user?.id; 

        if (!created_by) {
            return res.status(STATUS_CODES.UNAUTHORIZED).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
        }

        const product = await addProductService(org_id, serviceData, created_by);
        const successResponse = SuccessReturnHandler({
            message: SUCCESS_MESSAGES.DETAILS_ADD_SUCCESS,
            resp:product,
        });
        return res.status(STATUS_CODES.SUCCESS).json(successResponse);
    } catch (err) {
        if (err.validationErrors) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
              success: false,
              errors: err.validationErrors,
            });
          }
        next(err);
    }
};

exports.updateProductController = async (req, res, next) => {
    try {
        const {service_id} = req.params;
        const updatedData = req.body;
        const modified_by = req.user?.id; 

        if (!modified_by) {
            return res.status(STATUS_CODES.UNAUTHORIZED).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
        }

        const updatedProduct = await updateProductService(service_id, updatedData, modified_by);
        const successResponse = SuccessReturnHandler({
            message: SUCCESS_MESSAGES.UPDATE_SUCCESS,
            resp:updatedProduct,
        });
        return res.status(STATUS_CODES.SUCCESS).json(successResponse);
    } catch (err) {
        if (err.validationErrors) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
              success: false,
              errors: err.validationErrors,
            });
          }
        next(err);
    }
};

exports.viewProductController = async(req,res,next) =>{
    const {service_id} = req.params;
    try{
        const productDetails = await viewProductService(service_id)

        const successResponse = SuccessReturnHandler({
            message : SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
            resp:productDetails,
        });
        res.status(STATUS_CODES.SUCCESS).json(successResponse);
    }catch(err){
        next(err);
    }
}

exports.getProductsController = async(req,res,next) =>{
    const {org_id} = req.params;
    const { page, size } = req.query;
    
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(size, 10) || 10;

    try{
        const products = await getProductsService(org_id, pageNumber, pageSize);

        const successResponse = SuccessReturnHandler({
            message : SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
            resp: products,
        });
        res.status(STATUS_CODES.SUCCESS).json(successResponse);
    }catch(err){
        next(err);
    }
}

exports.myProductsController = async(req,res,next) =>{
    const user_id = req.user?.id;
    const { page, size } = req.query;
    
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(size, 10) || 10;

    try{
        const products = await myProductsService(user_id, pageNumber, pageSize);

        const successResponse = SuccessReturnHandler({
            message : SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
            resp: products,
        });
        res.status(STATUS_CODES.SUCCESS).json(successResponse);
    }catch(err){
        next(err);
    }
}

exports.deleteProductController = async(req,res,next) =>{
    const {service_id} = req.params;
    const deleted_by = req.user?.id; 
    try{
        if(!service_id){
            throw new AppError("service_id is required", STATUS_CODES.BAD_REQUEST);
        }

        const message = await deleteProductService(service_id, deleted_by);
        const successResponse = SuccessReturnHandler({
            message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
            resp: message,
        })
        return res.status(STATUS_CODES.SUCCESS).json(successResponse);
    }catch(err){
        next(err);
    }
}

exports.addMobileProductController = async (req, res, next) => {
    try {
        const {org_id} = req.params;
        const serviceData = req.body;
        const created_by = req.user?.id; 

        if (!created_by) {
            return res.status(STATUS_CODES.UNAUTHORIZED).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
        }

        const product = await addMobileProductService(org_id, serviceData, created_by);
        const successResponse = SuccessReturnHandler({
            message: SUCCESS_MESSAGES.DETAILS_ADD_SUCCESS,
            resp:product,
        });
        return res.status(STATUS_CODES.SUCCESS).json(successResponse);
    } catch (err) {
        if (err.validationErrors) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
              success: false,
              errors: err.validationErrors,
            });
          }
        next(err);
    }
};

exports.updateMobileProductController = async (req, res, next) => {
    try {
        const {service_id} = req.params;
        const updatedData = req.body;
        const modified_by = req.user?.id; 

        if (!modified_by) {
            return res.status(STATUS_CODES.UNAUTHORIZED).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
        }

        const updatedProduct = await updateMobileProductService(service_id, updatedData, modified_by);
        const successResponse = SuccessReturnHandler({
            message: SUCCESS_MESSAGES.UPDATE_SUCCESS,
            resp:updatedProduct,
        });
        return res.status(STATUS_CODES.SUCCESS).json(successResponse);
    } catch (err) {
        if (err.validationErrors) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
              success: false,
              errors: err.validationErrors,
            });
          }
        next(err);
    }
};