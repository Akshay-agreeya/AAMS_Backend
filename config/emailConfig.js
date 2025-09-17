// emailConfig.js - Outlook Configuration
const nodemailer = require("nodemailer");
require("dotenv").config();

console.log("Email config:");
console.log("EMAIL:", process.env.EMAIL);
console.log("PASS length:", process.env.EMAIL_PASSWORD?.length);

// Create transporter with Outlook settings
const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Email configuration error:", error.message);
  } else {
    console.log("Outlook email server is ready to send messages");
  }
});

module.exports = transporter;