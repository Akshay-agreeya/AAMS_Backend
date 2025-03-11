const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const {SUCCESS_MESSAGES } = require('../utils/responseMessages');
const { SuccessReturnHandler } = require("../middlewares/responseHandler");
const { getWebUrlsService, getAssessmentsService, getCategoryDataService } = require("../services/reportsService");

exports.getWebUrlsController = async(req,res,next) =>{
    const {org_id} = req.params;
    const { page, size } = req.query;
    
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(size, 10) || 10;

    try{
        const urls = await getWebUrlsService(org_id, pageNumber, pageSize);

        const successResponse = SuccessReturnHandler({
            message : SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
            resp: urls,
        });
        res.status(STATUS_CODES.SUCCESS).json(successResponse);
    }catch(err){
        next(err);
    }
}

exports.getAssessmentsController = async(req,res,next) =>{
    const {service_id} = req.params;
    const { page, size } = req.query;
    
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(size, 10) || 10;

    try{
        const urls = await getAssessmentsService(service_id, pageNumber, pageSize);

        const successResponse = SuccessReturnHandler({
            message : SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
            resp: urls,
        });
        res.status(STATUS_CODES.SUCCESS).json(successResponse);
    }catch(err){
        next(err);
    }
}

exports.getCategoryDataController = async(req,res,next) =>{
    const {assessment_id} = req.params;

    try{
        const categoryData = await getCategoryDataService(assessment_id)

        const successResponse = SuccessReturnHandler({
            message : SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
            resp: {content: categoryData},
        });
        res.status(STATUS_CODES.SUCCESS).json(successResponse);
    }catch(err){
        next(err);
    }
}