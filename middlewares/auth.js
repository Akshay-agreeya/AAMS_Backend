const jwt = require('jsonwebtoken');
const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const { AppError } = require('./errorHandler');
const dotenv = require('dotenv');
dotenv.config();

exports.verifyJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(STATUS_CODES.UNAUTHORIZED).json({ message: ERROR_MESSAGES.MISSING_TOKEN });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(STATUS_CODES.FORBIDDEN).json({ message: 'Token expired' });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(STATUS_CODES.FORBIDDEN).json({ message: 'Invalid token' });
    }

    return res.status(STATUS_CODES.UNAUTHORIZED).json({ message: ERROR_MESSAGES.INVALID_CREDENTIALS });
  }
};
