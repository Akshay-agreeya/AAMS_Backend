const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const {SUCCESS_MESSAGES } = require('../utils/responseMessages');
const { SuccessReturnHandler } = require("../middlewares/responseHandler");
const { getWebUrls, getWebUrlsService } = require("../services/reportsService");

exports.getWebUrlsController = async(req,res,next) =>{
    const {org_id} = req.params;
    try{
        const urls = await getWebUrlsService(org_id);

        const successResponse = SuccessReturnHandler({
            message : SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS,
            resp: urls,
        });
        res.status(STATUS_CODES.SUCCESS).json(successResponse);
    }catch(err){
        next(err);
    }
}