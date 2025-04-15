const { STATUS_CODES } = require("../utils/errorCodes");

exports.validateInputs = (schema) => (req, res, next) => {
    const errors = {}; // Use an object to store single messages instead of an array

    for (const key in schema) {
        const rule = schema[key];
        const value = req.body[key];

        // Skip validation if not required and missing
        if (!rule.required && (value === undefined || value === null || value === "")) {
            continue;
        }

        // Check if required field is missing
        if (rule.required && (value === undefined || value === null || value === "")) {
            errors[key] = `${key} is required.`;
            continue;
        }

        // Validate data types
        if (rule.type === "number") {
            if (typeof value !== "number" || !Number.isInteger(value)) {
                errors[key] = `${key} must be an integer.`;
                continue; 
            }
        } else if (rule.type === "array") {
            if (!Array.isArray(value)) {
                errors[key] = `${key} must be an array.`;
                continue;
            } else if (value.length === 0 && rule.required) {
                errors[key] = `${key} cannot be empty.`;
                continue;
            } else if (rule.itemsType === "number" && !value.every(item => Number.isInteger(item))) {
                errors[key] = `${key} must contain only integer values.`;
                continue;
            }
        } else if (rule.type && typeof value !== rule.type) {
            errors[key] = `${key} must be of type ${rule.type}.`;
            continue;
        }

        // Check minLength and maxLength (for strings and arrays)
        if (rule.minLength && value.length < rule.minLength) {
            errors[key] = `${key} must be at least ${rule.minLength} characters long.`;
            continue;
        }

        if (rule.maxLength && value.length > rule.maxLength) {
            errors[key] = `Must not exceed ${rule.maxLength} characters.`;
            continue;
        }

        // Validate regex pattern
        if (rule.pattern && !rule.pattern.test(value)) {
            const fieldRequirements = {
                password: "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.",
                oldPassword: "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.",
                newPassword: "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character",
                email: "Must be a valid email address.",
                phone_number: "Please enter only 10 digit numeric value"
                
            };

            errors[key] = `${fieldRequirements[key] || "does not meet the required format."}`;
        }
    }

    // If errors exist, return validation errors
    if (Object.keys(errors).length > 0) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            errors, 
        });
    }

    next();
};
