const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const {SUCCESS_MESSAGES } = require('../utils/responseMessages');
const {SuccessReturnHandler} = require('../middlewares/responseHandler');
const { getOrganizationTypeService, getIndustryTypeService } = require("../services/lookupService");

exports.getOrgTypeController = 
    async (req, res, next) => {
        try {
            const orgTypes = await getOrganizationTypeService();
            const successResponse = SuccessReturnHandler({
                message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
                resp: orgTypes,
            });
            return res.status(STATUS_CODES.SUCCESS).json(successResponse);
           
        } catch (err) {
            next(err)
        }
    };

exports.getIndustryTypeController = 
    async (req, res, next) => {
        try {
            const orgTypes = await getIndustryTypeService();
            const successResponse = SuccessReturnHandler({
                message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
                resp: orgTypes,
            });
            return res.status(STATUS_CODES.SUCCESS).json(successResponse);
           
        } catch (err) {
            next(err)
        }
    };