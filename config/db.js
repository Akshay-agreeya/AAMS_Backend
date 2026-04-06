const sql = require('mssql');
const dotenv = require('dotenv');
const path = require('path');

// ✅ Fix 1: Load the correct env file (same logic as app.js)
dotenv.config({ 
    path: path.resolve(__dirname, '..', process.env.NODE_ENV === 'production' ? 'production.env' : '.env') 
});

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    server: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT, 10) || 1433,
    options: {
        encrypt: false,                  // ✅ Fix 2: disable SSL (server uses IP, not domain)
        trustServerCertificate: true,
        enableArithAbort: true
    },
    requestTimeout: 60000
};

const validateEnv = () => {
    const requiredEnvVars = ['DB_USER', 'DB_PASS', 'DB_HOST', 'DB_NAME'];
    requiredEnvVars.forEach((key) => {
        if (!process.env[key]) {
            throw new Error(`${key} environment variable is not set properly.`);
        }
    });
};

let poolPromise;

const getConnectionPool = async () => {
    if (!poolPromise) {
        poolPromise = sql.connect(dbConfig)
            .then((pool) => {
                console.log('Database connection pool created.');
                return pool;
            })
            .catch((err) => {
                console.error('Failed to create database connection pool:', err);
                poolPromise = null; // ✅ Fix 3: reset so it can retry on next call
                throw err;
            });
    }
    return poolPromise;
};

validateEnv();

module.exports = { sql, getConnectionPool, dbConfig };




