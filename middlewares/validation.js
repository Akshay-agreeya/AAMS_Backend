const { STATUS_CODES } = require("../utils/errorCodes");

exports.validateInputs = (schema) => (req, res, next) => {
    const errors = [];

    for (const key in schema) {
        const rule = schema[key];
        const value = req.body[key];
        
        // Skip validation if the field is not required and not provided
        if (!rule.required && (value === undefined || value === null || value === '')) {
            continue;
        }
        // Check if the value is required but missing
        if (rule.required && (value === undefined || value === null || value === '')) {
            errors.push(`${key} is required.`);
            continue;
        }

        // Check data type
        if (rule.type === "number") {
            if (typeof value !== "number" || !Number.isInteger(value)) {
                errors.push(`${key} must be an integer.`);
            }
        } else if (rule.type && typeof value !== rule.type) {
            errors.push(`${key} must be of type ${rule.type}.`);
        }

        // Check for enum values
        if (rule.enum && !rule.enum.includes(value)) {
            errors.push(`${key} must be one of: ${rule.enum.join(", ")}.`);
        }

        if (rule.minLength && value.length < rule.minLength) {
            errors.push(`${key} must be at least ${rule.minLength} characters long.`);
        }
        if (rule.maxLength && value.length > rule.maxLength) {
            errors.push(`${key} must be no more than ${rule.maxLength} characters long.`);
        }

        // Check regex pattern
        if (rule.pattern && !rule.pattern.test(value)) {
            errors.push(`${key} is invalid.`);
        }
    }

    // If errors exist, respond with 400 and list of errors
    if (errors.length > 0) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            errors,
        });
    }

    next(); 
};
