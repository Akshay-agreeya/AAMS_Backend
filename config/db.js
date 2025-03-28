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
        trustServerCertificate: true
        // trustServerCertificate: process.env.NODE_ENV !== 'production', // Allow self-signed certs in dev
    },
};

// Validate required environment variables before proceeding
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
                console.log(process.env.RESET_URL);
                return pool;
            })
            .catch((err) => {
                console.error('Failed to create database connection pool:', err);
                throw err;
            });
    }

    return poolPromise;
};

// Validate environment variables at startup
validateEnv();

module.exports = { sql, getConnectionPool, dbConfig };
