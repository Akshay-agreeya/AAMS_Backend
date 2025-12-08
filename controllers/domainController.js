const { STATUS_CODES, ERROR_MESSAGES } = require("../utils/errorCodes");
const { SUCCESS_MESSAGES } = require('../utils/responseMessages');
const { SuccessReturnHandler } = require('../middlewares/responseHandler');
const { crawlForPDFs } = require('../PDF/service/pdfCrawler');

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
    const { website_url } = req.body;

    try {
        if (!website_url) {
            throw new AppError("website_url is required", 400);
        }

        // pdf_count is 0 because crawl has not happened yet
        const domainData = await registerDomainService({
            website_url,
            pdf_count: 0
        });

        return res.status(201).json(
            SuccessReturnHandler({
                message: SUCCESS_MESSAGES.DOMAIN_REGISTERED_SUCCESS,
                resp: domainData,
            })
        );

    } catch (err) {
        next(err);
    }
};


exports.updateDomainController = async (req, res, next) => {
    const { scan_id } = req.params;
    const { website_url } = req.body;

    try {
        if (!website_url) {
            throw new AppError("website_url is required", 400);
        }

        const result = await updateDomainService(scan_id, website_url);

        return res.status(200).json(
            SuccessReturnHandler({
                message: SUCCESS_MESSAGES.DOMAIN_UPDATED_SUCCESS,
                resp: result
            })
        );

    } catch (err) {
        next(err);
    }
};

exports.deleteDomainController = async (req, res, next) => {
    const { scan_id } = req.params;

    try {
        await deleteDomainService(scan_id);

        return res.status(200).json(
            SuccessReturnHandler({
                message: SUCCESS_MESSAGES.DOMAIN_DELETED_SUCCESS,
                resp: { scan_id }
            })
        );

    } catch (err) {
        next(err);
    }
};
