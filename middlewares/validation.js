const { STATUS_CODES } = require("../utils/errorCodes");

exports.validateInputs = (schema) => (req, res, next) => {
    const errors = [];

    for (const key in schema) {
        const rule = schema[key];
        const value = req.body[key];

        // Skip validation if not required and missing
        if (!rule.required && (value === undefined || value === null || value === "")) {
            continue;
        }

        // Check if required field is missing
        if (rule.required && (value === undefined || value === null || value === "")) {
            errors.push(`${key} is required.`);
            continue;
        }

        // Validate data types
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
            } else if (rule.itemsType === "object" && rule.itemsSchema) {
                // Validate each object inside the array
                value.forEach((item, index) => {
                    for (const subKey in rule.itemsSchema) {
                        const subRule = rule.itemsSchema[subKey];
                        const subValue = item[subKey];

                        if (subRule.required && (subValue === undefined || subValue === null || subValue === "")) {
                            errors.push(`usersWithServices[${index}].${subKey} is required.`);
                        } else if (subRule.type === "number" && typeof subValue !== "number") {
                            errors.push(`usersWithServices[${index}].${subKey} must be a number.`);
                        } else if (subRule.type === "array" && !Array.isArray(subValue)) {
                            errors.push(`usersWithServices[${index}].${subKey} must be an array.`);
                        }
                    }
                });
            }
        } else if (rule.type && typeof value !== rule.type) {
            errors.push(`${key} must be of type ${rule.type}.`);
        }

        // Validate regex pattern
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

    // If errors exist, return validation errors
    if (errors.length > 0) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            errors,
        });
    }

    next();
};
