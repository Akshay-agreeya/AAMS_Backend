// HTTP Status Codes
const STATUS_CODES = {
    SUCCESS: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
};

// Error Messages
const ERROR_MESSAGES = {
    MISSING_FIELDS: "Some required fields are missing.",
    MISSING_TOKEN:"Token is missing",
    INVALID_EMAIL: "The email address is not valid.",
    INVALID_CREDENTIALS: "Invalid credentials",
    UNAUTHORIZED: "You are not authorized to perform this action.",
    USER_NOT_FOUND: "User not found.",
    DATA_NOT_FOUND: "Data not found",
    EMAIL_ALREADY_EXISTS: "This email address is already registered.",
    INTERNAL_SERVER_ERROR: "An unexpected error occurred. Please try again later.",
};

module.exports = { STATUS_CODES, ERROR_MESSAGES };