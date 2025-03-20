const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const {SUCCESS_MESSAGES } = require('../utils/responseMessages');
const {SuccessReturnHandler} = require('../middlewares/responseHandler');
const { getCountService, getExpiringService, getRecentActivitiesService, getSummaryDetailReportService, getServiceTypeCount } = require("../services/dashboardService");

exports.getCountController = 
    async (req, res, next) => {
        try {
            const countRow = await getCountService();
            const successResponse = SuccessReturnHandler({
                message: SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
                resp: countRow,
            });
            return res.status(STATUS_CODES.SUCCESS).json(successResponse);
           
        } catch (err) {
            next(err)
        }
    };

 exports.getExpiringController = async(req,res,next) =>{
        const { days = 30} = req.query;
    
        try{
            const expiring_services = await getExpiringService(days)
 
            const successResponse = SuccessReturnHandler({
                message : SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
                resp: expiring_services,
            });
            res.status(STATUS_CODES.SUCCESS).json(successResponse);
        }catch(err){
            next(err);
        }
    }

exports.getRecentActivitiesController = async(req,res,next) =>{
        const { days, page, size } = req.query;

        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = parseInt(size, 10) || 10;
    
        try{
            const recent_activities = await getRecentActivitiesService(days, pageNumber, pageSize)
 
            const successResponse = SuccessReturnHandler({
                message : SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
                resp: recent_activities,
            });
            res.status(STATUS_CODES.SUCCESS).json(successResponse);
        }catch(err){
            next(err);
        }
    }

exports.getSummaryDetailReportController = async(req,res,next) =>{
        const {assessment_id} = req.params;
    
        try{
            const summary_data = await getSummaryDetailReportService(assessment_id)
    
            const successResponse = SuccessReturnHandler({
                message : SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
                resp:  summary_data,
            });
            res.status(STATUS_CODES.SUCCESS).json(successResponse);
        }catch(err){
            next(err);
        }
    }

    exports.getServiceTypeCountController = async(req, res, next) =>{
        try{
            const service_type = await getServiceTypeCount()
            const successResponse = SuccessReturnHandler({
                message : SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
                resp: service_type,
            });
            res.status(STATUS_CODES.SUCCESS).json(successResponse);
        }catch(err){
            next(err);
        }
    }