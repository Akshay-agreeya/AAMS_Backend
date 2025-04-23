const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const generateToken = (payload) => {
    return jwt.sign({id:payload}, process.env.JWT_SECRET, { expiresIn: '24h' });
};

const generateRefreshToken = (payload) => {
    return jwt.sign({id:payload}, process.env.REFRESH_SECRET,{expiresIn:'30d'})
}

module.exports = { generateToken, generateRefreshToken};