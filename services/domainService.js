const { sql, getConnectionPool } = require("../config/db");
const { ERROR_MESSAGES, STATUS_CODES } = require("../utils/errorCodes");
const { AppError } = require("../middlewares/errorHandler");

/**
 * Register a new domain
 * Inserts a new record into PDF_Scan_History_DEV table
 */
exports.registerDomainService = async ({ website_url, pdf_count }) => {
    try {
        const pool = await getConnectionPool();

        // Check if domain already registered
        const existingDomain = await pool.request()
            .input('website_url', sql.VarChar(500), website_url)
            .query(`
                SELECT scan_id 
                FROM PDF_Scan_History_DEV
                WHERE website_url = @website_url
            `);

        if (existingDomain.recordset.length > 0) {
            throw new AppError("Domain already exists", STATUS_CODES.CONFLICT || 409);
        }

        // Insert new domain
        const result = await pool.request()
            .input('website_url', sql.VarChar(500), website_url)
            .input('pdf_count', sql.Int, pdf_count)
            .input('scan_date', sql.DateTime, new Date())
            .query(`
                INSERT INTO PDF_Scan_History_DEV (website_url, pdf_count, scan_date)
                OUTPUT INSERTED.scan_id, INSERTED.website_url, INSERTED.pdf_count, INSERTED.scan_date
                VALUES (@website_url, @pdf_count, @scan_date)
            `);

        return result.recordset[0];

    } catch (err) {
        if (err instanceof AppError) throw err;

        throw new AppError(
            ERROR_MESSAGES.DATABASE_ERROR || "Database error",
            STATUS_CODES.INTERNAL_SERVER_ERROR || 500
        );
    }
};

exports.updateDomainService = async (scan_id, website_url) => {
    try {
        const pool = await getConnectionPool();

        // Check if scan exists
        const exists = await pool.request()
            .input("scan_id", sql.Int, scan_id)
            .query(`
                SELECT scan_id FROM PDF_Scan_History_DEV WHERE scan_id = @scan_id
            `);

        if (exists.recordset.length === 0) {
            throw new AppError("Invalid scan_id", 404);
        }

        // Update domain
        const result = await pool.request()
            .input("scan_id", sql.Int, scan_id)
            .input("website_url", sql.VarChar(500), website_url)
            .query(`
                UPDATE PDF_Scan_History_DEV
                SET website_url = @website_url
                WHERE scan_id = @scan_id;

                SELECT scan_id, website_url, pdf_count, scan_date
                FROM PDF_Scan_History_DEV
                WHERE scan_id = @scan_id;
            `);

        return result.recordset[0];

    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError("Database error", 500);
    }
};

exports.deleteDomainService = async (scan_id) => {
    try {
        const pool = await getConnectionPool();

        // Delete PDF records first (foreign key)
        await pool.request()
            .input("scan_id", sql.Int, scan_id)
            .query(`
                DELETE FROM PDF_Scan_Files_DEV WHERE scan_id = @scan_id
            `);

        // Delete from history
        const result = await pool.request()
            .input("scan_id", sql.Int, scan_id)
            .query(`
                DELETE FROM PDF_Scan_History_DEV WHERE scan_id = @scan_id
            `);

        if (result.rowsAffected[0] === 0) {
            throw new AppError("Invalid scan_id", 404);
        }

    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError("Database error", 500);
    }
};
