const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const {SUCCESS_MESSAGES } = require('../utils/responseMessages');
const {SuccessReturnHandler} = require('../middlewares/responseHandler');
const {getFormDataService, addFormDataService, editFormDataService, deleteformDataService, getManualTxnsService, getManualReportService} = require('../services/manualServce');

exports.getFormDataController = 
    async (req, res, next) => {
        try {
            const formData = await getFormDataService();
            const successResponse = SuccessReturnHandler({
                message: SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
                resp: formData,
            });
            return res.status(STATUS_CODES.SUCCESS).json(successResponse);
           
        } catch (err) {
            next(err)
        }
    };

    exports.addFormDataController = 
    async (req, res, next) => {
        const {service_id} = req.params;
        const {assessmentData} = req.body;
        const created_by = req.user?.id; 
        try {
            const txnId = await addFormDataService(service_id, assessmentData, created_by);
            const successResponse = SuccessReturnHandler({
                message: SUCCESS_MESSAGES.DETAILS_ADD_SUCCESS,
                resp: txnId,
            });
            return res.status(STATUS_CODES.SUCCESS).json(successResponse);
           
        } catch (err) {
            next(err)
        }
    };

    exports.editFormDataController = 
    async (req, res, next) => {
        const {txn_id} = req.params;
        const {assessmentData} = req.body;
        const modified_by = req.user?.id; 
        try {
            const result = await editFormDataService(txn_id, assessmentData, modified_by);
            const successResponse = SuccessReturnHandler({
                message: SUCCESS_MESSAGES.UPDATE_SUCCESS,
                resp: result,
            });
            return res.status(STATUS_CODES.SUCCESS).json(successResponse);
           
        } catch (err) {
            next(err)
        }
    };

      exports.deleteFormDataController = 
    async (req, res, next) => {
        const {txn_id} = req.params;
        try {
            const result = await deleteformDataService(txn_id);
            const successResponse = SuccessReturnHandler({
                message: SUCCESS_MESSAGES.OPERATION_SUCCESS,
                resp: result,
            });
            return res.status(STATUS_CODES.SUCCESS).json(successResponse);
           
        } catch (err) {
            next(err)
        }
    };

    exports.getManualTxnsController = async(req,res,next) =>{
        const {service_id} = req.params;
        const { page, size } = req.query;
        
        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = parseInt(size, 10) || 10;
    
        try{
            const urls = await getManualTxnsService(service_id, pageNumber, pageSize);
    
            const successResponse = SuccessReturnHandler({
                message : SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
                resp: urls,
            });
            res.status(STATUS_CODES.SUCCESS).json(successResponse);
        }catch(err){
            next(err);
        }
    }

    exports.getManualReportController = async(req,res,next) =>{
        const {txn_id} = req.params;
    
        try{
            const manualReort = await getManualReportService(txn_id)
    
            const successResponse = SuccessReturnHandler({
                message : SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
                resp:  manualReort,
            });
            res.status(STATUS_CODES.SUCCESS).json(successResponse);
        }catch(err){
            next(err);
        }
    }
    