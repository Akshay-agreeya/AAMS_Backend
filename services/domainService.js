const { sql, getConnectionPool } = require("../config/db");
const { ERROR_MESSAGES, STATUS_CODES } = require("../utils/errorCodes");
const { AppError } = require("../middlewares/errorHandler");

/**
 * Register a new domain
 * Inserts a new record into PDF_Scan_History_DEV table
 */
exports.registerDomainService = async (domainData) => {
    const { website_url, pdf_count } = domainData;

    try {
        const pool = await getConnectionPool();

        // Check if domain already exists
        const existingDomain = await pool.request()
            .input('website_url', sql.VarChar(500), website_url)
            .query(`
                SELECT scan_id, website_url, pdf_count, scan_date
                FROM PDF_Scan_History_DEV
                WHERE website_url = @website_url
            `);

        if (existingDomain.recordset.length > 0) {
            throw new AppError(
                ERROR_MESSAGES.DOMAIN_ALREADY_EXISTS || 'Domain already exists',
                STATUS_CODES.CONFLICT || 409
            );
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
        if (err instanceof AppError) {
            throw err;
        }
        throw new AppError(
            ERROR_MESSAGES.DATABASE_ERROR || 'Database error occurred',
            STATUS_CODES.INTERNAL_SERVER_ERROR || 500
        );
    }
};

/**
 * Get a specific domain by scan_id
 */
exports.getDomainService = async (scan_id) => {
    try {
        const pool = await getConnectionPool();

        const result = await pool.request()
            .input('scan_id', sql.Int, scan_id)
            .query(`
                SELECT scan_id, website_url, pdf_count, scan_date
                FROM PDF_Scan_History_DEV
                WHERE scan_id = @scan_id
            `);

        if (!result.recordset.length) {
            throw new AppError(
                ERROR_MESSAGES.DOMAIN_NOT_FOUND || 'Domain not found',
                STATUS_CODES.NOT_FOUND || 404
            );
        }

        return result.recordset[0];
    } catch (err) {
        if (err instanceof AppError) {
            throw err;
        }
        throw new AppError(
            ERROR_MESSAGES.DATABASE_ERROR || 'Database error occurred',
            STATUS_CODES.INTERNAL_SERVER_ERROR || 500
        );
    }
};

/**
 * Get all domains
 */
exports.getAllDomainsService = async () => {
    try {
        const pool = await getConnectionPool();

        const result = await pool.request()
            .query(`
                SELECT scan_id, website_url, pdf_count, scan_date
                FROM PDF_Scan_History_DEV
                ORDER BY scan_date DESC
            `);

        return {
            total: result.recordset.length,
            domains: result.recordset
        };
    } catch (err) {
        throw new AppError(
            ERROR_MESSAGES.DATABASE_ERROR || 'Database error occurred',
            STATUS_CODES.INTERNAL_SERVER_ERROR || 500
        );
    }
};

/**
 * Update a domain
 */
exports.updateDomainService = async (scan_id, updateData) => {
    const { website_url, pdf_count } = updateData;

    try {
        const pool = await getConnectionPool();

        // Check if domain exists
        const existingDomain = await pool.request()
            .input('scan_id', sql.Int, scan_id)
            .query(`
                SELECT scan_id
                FROM PDF_Scan_History_DEV
                WHERE scan_id = @scan_id
            `);

        if (!existingDomain.recordset.length) {
            throw new AppError(
                ERROR_MESSAGES.DOMAIN_NOT_FOUND || 'Domain not found',
                STATUS_CODES.NOT_FOUND || 404
            );
        }

        // Build dynamic update query
        let updateFields = [];
        const request = pool.request();
        request.input('scan_id', sql.Int, scan_id);

        if (website_url) {
            updateFields.push('website_url = @website_url');
            request.input('website_url', sql.VarChar(500), website_url);
        }

        if (pdf_count !== undefined && pdf_count !== null) {
            updateFields.push('pdf_count = @pdf_count');
            request.input('pdf_count', sql.Int, pdf_count);
        }

        if (updateFields.length === 0) {
            throw new AppError(
                'No fields to update',
                STATUS_CODES.BAD_REQUEST || 400
            );
        }

        const result = await request.query(`
            UPDATE PDF_Scan_History_DEV
            SET ${updateFields.join(', ')}
            OUTPUT INSERTED.scan_id, INSERTED.website_url, INSERTED.pdf_count, INSERTED.scan_date
            WHERE scan_id = @scan_id
        `);

        return result.recordset[0];
    } catch (err) {
        if (err instanceof AppError) {
            throw err;
        }
        throw new AppError(
            ERROR_MESSAGES.DATABASE_ERROR || 'Database error occurred',
            STATUS_CODES.INTERNAL_SERVER_ERROR || 500
        );
    }
};

/**
 * Delete a domain
 */
exports.deleteDomainService = async (scan_id) => {
    try {
        const pool = await getConnectionPool();

        // Check if domain exists
        const existingDomain = await pool.request()
            .input('scan_id', sql.Int, scan_id)
            .query(`
                SELECT scan_id
                FROM PDF_Scan_History_DEV
                WHERE scan_id = @scan_id
            `);

        if (!existingDomain.recordset.length) {
            throw new AppError(
                ERROR_MESSAGES.DOMAIN_NOT_FOUND || 'Domain not found',
                STATUS_CODES.NOT_FOUND || 404
            );
        }

        // Delete domain
        await pool.request()
            .input('scan_id', sql.Int, scan_id)
            .query(`
                DELETE FROM PDF_Scan_History_DEV
                WHERE scan_id = @scan_id
            `);

        return { success: true };
    } catch (err) {
        if (err instanceof AppError) {
            throw err;
        }
        throw new AppError(
            ERROR_MESSAGES.DATABASE_ERROR || 'Database error occurred',
            STATUS_CODES.INTERNAL_SERVER_ERROR || 500
        );
    }
};