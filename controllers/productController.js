const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const {SUCCESS_MESSAGES } = require('../utils/responseMessages');
const { SuccessReturnHandler } = require("../middlewares/responseHandler");
const {addProductService, updateProductService} = require("../services/productService")

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
            resp: product,
        });
        return res.status(STATUS_CODES.SUCCESS).json(successResponse);
    } catch (err) {
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
            resp: updatedProduct,
        });
        return res.status(STATUS_CODES.SUCCESS).json(successResponse);
    } catch (err) {
        next(err);
    }
};