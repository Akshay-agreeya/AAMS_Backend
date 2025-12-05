const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const { SUCCESS_MESSAGES } = require('../utils/responseMessages');
const { SuccessReturnHandler } = require('../middlewares/responseHandler');
const {
    registerDomainService,
    updateDomainService,
    deleteDomainService,
    getDomainService,
    getAllDomainsService
} = require("../services/domainService");

/**
 * Register a new domain
 * @route POST /api/domains/register
 * @access Protected (JWT required)
 */
exports.registerDomainController = async (req, res, next) => {
    const { website_url, pdf_count } = req.body;

    try {
        // Validation
        if (!website_url || pdf_count === undefined) {
            throw new Error('website_url and pdf_count are required');
        }

        const domainData = await registerDomainService({
            website_url,
            pdf_count
        });

        const successResponse = SuccessReturnHandler({
            message: SUCCESS_MESSAGES.DOMAIN_REGISTERED_SUCCESS || 'Domain registered successfully',
            resp: domainData,
        });
        return res.status(STATUS_CODES.CREATED || 201).json(successResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * Get a specific domain by scan_id
 * @route GET /api/domains/:scan_id
 * @access Protected (JWT required)
 */
exports.getDomainController = async (req, res, next) => {
    const { scan_id } = req.params;

    try {
        const domainData = await getDomainService(scan_id);

        const successResponse = SuccessReturnHandler({
            message: SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS || 'Domain details fetched successfully',
            resp: domainData,
        });
        return res.status(STATUS_CODES.SUCCESS || 200).json(successResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * Get all domains
 * @route GET /api/domains
 * @access Protected (JWT required)
 */
exports.getAllDomainsController = async (req, res, next) => {
    try {
        const domainsData = await getAllDomainsService();

        const successResponse = SuccessReturnHandler({
            message: SUCCESS_MESSAGES.DETAILS_FETCHED_SUCCESS || 'All domains fetched successfully',
            resp: domainsData,
        });
        return res.status(STATUS_CODES.SUCCESS || 200).json(successResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * Update a domain
 * @route PUT /api/domains/:scan_id
 * @access Protected (JWT required)
 */
exports.updateDomainController = async (req, res, next) => {
    const { scan_id } = req.params;
    const { website_url, pdf_count } = req.body;

    try {
        // At least one field should be provided for update
        if (!website_url && pdf_count === undefined) {
            throw new Error('At least one field (website_url or pdf_count) is required for update');
        }

        const updatedData = await updateDomainService(scan_id, {
            website_url,
            pdf_count
        });

        const successResponse = SuccessReturnHandler({
            message: SUCCESS_MESSAGES.DOMAIN_UPDATED_SUCCESS || 'Domain updated successfully',
            resp: updatedData,
        });
        return res.status(STATUS_CODES.SUCCESS || 200).json(successResponse);
    } catch (err) {
        next(err);
    }
};

/**
 * Delete a domain
 * @route DELETE /api/domains/:scan_id
 * @access Protected (JWT required)
 */
exports.deleteDomainController = async (req, res, next) => {
    const { scan_id } = req.params;

    try {
        await deleteDomainService(scan_id);

        const successResponse = SuccessReturnHandler({
            message: SUCCESS_MESSAGES.DOMAIN_DELETED_SUCCESS || 'Domain deleted successfully',
            resp: { scan_id: parseInt(scan_id) },
        });
        return res.status(STATUS_CODES.SUCCESS || 200).json(successResponse);
    } catch (err) {
        next(err);
    }
};