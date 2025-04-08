const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const {SUCCESS_MESSAGES } = require('../utils/responseMessages');
const {SuccessReturnHandler} = require('../middlewares/responseHandler');
const { getCountService, getExpiringService, getRecentActivitiesService, getSummaryDetailReportService, getServiceTypeCount, getOrgUserCountService, getProductCompliance, getLatestNotification, updateNotificationStatus } = require("../services/dashboardService");

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
        const { days = 30, page, size} = req.query;
        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = parseInt(size, 10) || 4;
    
        try{
            const expiring_services = await getExpiringService(days, pageNumber, pageSize)
 
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
        const { org_id, days =30, page, size } = req.query;

        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = parseInt(size, 10) || 10;
    
        try{
            const recent_activities = await getRecentActivitiesService(org_id, days, pageNumber, pageSize)
 
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

    
exports.getOrgUserCountController = async(req, res, next) =>{
    const {org_id} = req.params;
    try{
        const count = await getOrgUserCountService(org_id)
        const successResponse = SuccessReturnHandler({
            message : SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
            resp: count,
        });
        res.status(STATUS_CODES.SUCCESS).json(successResponse);
    }catch(err){
        next(err);
    }
}

exports.getProductComplianceController = async(req, res, next) =>{
    try{
        const compliant_report = await getProductCompliance()
        const successResponse = SuccessReturnHandler({
            message : SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
            resp: compliant_report,
        });
        res.status(STATUS_CODES.SUCCESS).json(successResponse);
    }catch(err){
        next(err);
    }
}

exports.getLatestNotificationController = async(req, res, next) =>{
    const {user_id} = req.params;
    const latest_flag = req.query.latest_flag === '1';

console.log(typeof(latest_flag));
    try{
   const latest_notification = await getLatestNotification(user_id, latest_flag)
   const successResponse = SuccessReturnHandler({
       message : SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
       resp: latest_notification
   })
   res.status(STATUS_CODES.SUCCESS).json(successResponse);
    }catch(err){
    next(err);
    }
}

exports.updateNotificationStatusController = async(req, res, next) =>{
    const {notification_id} = req.body;
    try{
   const notification = await updateNotificationStatus(notification_id)
   const successResponse = SuccessReturnHandler({
       message : SUCCESS_MESSAGES.UPDATE_SUCCESS,
       resp: notification
   })
   res.status(STATUS_CODES.SUCCESS).json(successResponse);
    }catch(err){
    next(err);
    }
}