const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");

class AppError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

exports.AppError = AppError;

exports.GlobalErrorHandler = (err, req, res, next) => {
    console.error("Error:", err.message || err);

    // If custom error code is provided in error object
    const statusCode = err.status || STATUS_CODES.INTERNAL_SERVER_ERROR;
    const message = err.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json({
        success: false,
        message,
        details: err.details || {},
    });
};
