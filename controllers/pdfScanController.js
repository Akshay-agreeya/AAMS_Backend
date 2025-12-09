const { crawlForPDFs } = require('../PDF/service/pdfCrawler');
const { savePdfRecord, updatePdfCountService, getDomainByScanId, getPdfScanService } = require("../services/pdfScanService");
const AppError = require("../middlewares/errorHandler").AppError;
const { SuccessReturnHandler } = require("../middlewares/responseHandler");

exports.generatePdfScanController = async (req, res, next) => {
    const { scan_id } = req.body;

    try {
        if (!scan_id) {
            throw new AppError("scan_id is required", 400);
        }

        // Fetch domain so we know which website to crawl
        const domain = await getDomainByScanId(scan_id);
        if (!domain) {
            throw new AppError("Invalid scan_id", 404);
        }

        const website_url = domain.website_url;

        // Crawl PDFs
        const { pdfs } = await crawlForPDFs(website_url, 3);

        // Save PDFs in DB
        for (const pdf of pdfs) {
            await savePdfRecord({
                scan_id,
                file_name: pdf.name,
                file_link: pdf.link,
                page_count: pdf.pages,
                file_category: pdf.category,
                upload_date: pdf.lastModified || new Date()
            });
        }

        // Update pdf_count in domain table
        await updatePdfCountService(scan_id, pdfs.length);

        return res.status(200).json({
            success: true,
            scan_id,
            pdf_count: pdfs.length,
            message: "PDFs scanned and saved successfully"
        });

    } catch (err) {
        next(err);
    }
};

exports.getPdfScanController = async (req, res, next) => {
    const { scan_id } = req.params;

    try {
        if (!scan_id) {
            throw new AppError("scan_id is required", 400);
        }

        const pdfData = await getPdfScanService(scan_id);

        return res.status(200).json(
            SuccessReturnHandler({
                message: "PDF scan files fetched successfully",
                resp: pdfData
            })
        );

    } catch (err) {
        next(err);
    }
};

