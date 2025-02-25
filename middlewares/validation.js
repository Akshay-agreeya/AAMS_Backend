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
} else if (rule.type === "array") {
    if (!Array.isArray(value)) {
        errors.push(`${key} must be an array.`);
    } else if (value.length === 0 && rule.required) {
        errors.push(`${key} cannot be empty.`);
    } else if (rule.itemsType === "number" && !value.every(item => Number.isInteger(item))) {
        errors.push(`${key} must contain only integer values.`);
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


    if (rule.pattern && !rule.pattern.test(value)) {
        const fieldRequirements = {
            password: "must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
            oldPassword: "must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
            newPassword: "must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
            email: "must be a valid email address.",
            phone_number: "must be a valid phone number."
        };
    
        const requirement = fieldRequirements[key] || "does not meet the required format.";
        errors.push(`${key} ${requirement}`);
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
