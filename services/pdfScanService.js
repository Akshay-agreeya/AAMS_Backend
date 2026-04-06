const { sql, getConnectionPool } = require("../config/db");
const { AppError } = require("../middlewares/errorHandler");
const { SuccessReturnHandler } = require("../middlewares/responseHandler");

exports.getDomainByScanId = async (scan_id) => {
    const pool = await getConnectionPool();
    const result = await pool.request()
        .input("scan_id", sql.Int, scan_id)
        .query(`
            SELECT website_url
            -- FROM PDF_Scan_History_DEV
            FROM PDF_Scan_History

            WHERE scan_id = @scan_id
        `);

    return result.recordset[0];
};

exports.savePdfRecord = async (data) => {
    const pool = await getConnectionPool();
    const request = pool.request();

    request.input("scan_id", sql.Int, data.scan_id);
    request.input("file_name", sql.NVarChar, data.file_name);
    request.input("file_link", sql.NVarChar, data.file_link);
    request.input("page_count", sql.Int, data.page_count);
    request.input("file_category", sql.NVarChar, data.file_category);
    request.input("upload_date", sql.DateTime, data.upload_date);

    await request.query(`
        -- INSERT INTO PDF_Scan_Files_DEV (scan_id, file_name, file_link, page_count, file_category, upload_date)
        INSERT INTO PDF_Scan_Files (scan_id, file_name, file_link, page_count, file_category, upload_date)

        VALUES (@scan_id, @file_name, @file_link, @page_count, @file_category, @upload_date)
    `);
};

exports.updatePdfCountService = async (scan_id, pdf_count) => {
    const pool = await getConnectionPool();

    await pool.request()
        .input("scan_id", sql.Int, scan_id)
        .input("pdf_count", sql.Int, pdf_count)
        .query(`
            // UPDATE PDF_Scan_History_DEV
                        UPDATE PDF_Scan_History

            SET pdf_count = @pdf_count
            WHERE scan_id = @scan_id
        `);
};

exports.getPdfScanService = async (scan_id) => {
    try {
        const pool = await getConnectionPool();

        const result = await pool.request()
            .input('scan_id', sql.Int, scan_id)
            .query(`
                SELECT 
                    file_id,
                    scan_id,
                    file_name,
                    file_link,
                    page_count,
                    file_category,
                    upload_date
                -- FROM PDF_Scan_Files_DEV
                FROM PDF_Scan_Files

                WHERE scan_id = @scan_id
            `);

        return result.recordset;

    } catch (err) {
        console.error("Database error in getPdfScanService:", err);
        throw new AppError("Database error", 500);
    }
};
