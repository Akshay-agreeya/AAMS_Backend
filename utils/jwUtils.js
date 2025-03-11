const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const generateToken = (payload) => {
    return jwt.sign({id:payload}, process.env.JWT_SECRET, { expiresIn: '1h' });
};

module.exports = { generateToken};