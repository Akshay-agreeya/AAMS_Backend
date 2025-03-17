const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const {SUCCESS_MESSAGES } = require('../utils/responseMessages');
const {SuccessReturnHandler} = require('../middlewares/responseHandler');
const { getCountService, getExpiringService } = require("../services/dashboardService");

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