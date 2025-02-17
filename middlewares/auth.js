const jwt = require('jsonwebtoken');
const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const { AppError } = require('./errorHandler');

exports.verifyJwt = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(STATUS_CODES.UNAUTHORIZED).json({ error: ERROR_MESSAGES.MISSING_TOKEN });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(STATUS_CODES.UNAUTHORIZED).json({ error: ERROR_MESSAGES.INVALID_CREDENTIALS });
    }
};