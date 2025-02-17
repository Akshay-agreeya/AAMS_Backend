const { STATUS_CODES } = require("../utils/errorCodes");

exports.SuccessReturnHandler = ({ message, resp, statusCode = STATUS_CODES.SUCCESS }) => {
    return {
        status: statusCode,
        success: true,
        message,
        data: resp,
    };
}