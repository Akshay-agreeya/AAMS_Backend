const sql = require('mssql');
const dotenv = require('dotenv');
dotenv.config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    server: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT, 10) || 1433,
    options: {
        encrypt: process.env.NODE_ENV === 'production', // Use SSL in production
        trustServerCertificate: process.env.NODE_ENV !== 'production', // Allow self-signed certs in dev
    },
};

let pool;

const getConnectionPool = async () => {
    try {
        if (!pool) {
            pool = await sql.connect(dbConfig);
            console.log('Database connection pool created.');
        }
        return pool;
    } catch (err) {
        console.error('Failed to create or reuse the database connection pool:', err);
        throw err;
    }
};

// Validate environment variables
if (!process.env.DB_USER || !process.env.DB_PASS || !process.env.DB_HOST || !process.env.DB_NAME) {
    throw new Error('Database environment variables are not set properly.');
}


module.exports = { sql, getConnectionPool, dbConfig };
