const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const {SUCCESS_MESSAGES } = require('../utils/responseMessages');
const {SuccessReturnHandler} = require('../middlewares/responseHandler');
const {getFormDataService, addFormDataService, editFormDataService} = require('../services/manualServce');

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
        const {formData} = req.body;
        const created_by = req.user?.id; 
        try {
            const txnId = await addFormDataService(service_id, formData, created_by);
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
        const {formData} = req.body;
        const modified_by = req.user?.id; 
        try {
            const result = await editFormDataService(txn_id, formData, modified_by);
            const successResponse = SuccessReturnHandler({
                message: SUCCESS_MESSAGES.UPDATE_SUCCESS,
                resp: result,
            });
            return res.status(STATUS_CODES.SUCCESS).json(successResponse);
           
        } catch (err) {
            next(err)
        }
    };