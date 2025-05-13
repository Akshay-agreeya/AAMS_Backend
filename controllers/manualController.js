const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const {SUCCESS_MESSAGES } = require('../utils/responseMessages');
const {SuccessReturnHandler} = require('../middlewares/responseHandler');
const {getFormDataService, addFormDataService} = require('../services/manualServce');

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
        const {service_id, formData} = req.body;
        try {
            const txnId = await addFormDataService(service_id, formData);
            const successResponse = SuccessReturnHandler({
                message: SUCCESS_MESSAGES.DETAILS_ADD_SUCCESS,
                resp: txnId,
            });
            return res.status(STATUS_CODES.SUCCESS).json(successResponse);
           
        } catch (err) {
            next(err)
        }
    };