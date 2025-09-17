// emailUtils.js - Updated for Outlook
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

exports.sendEmail = async (to, subject, text, html = null) => {
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false // Add this for Outlook compatibility
    }
  });

  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.EMAIL}>`,
    to,
    subject,
    text
  };

  // Add HTML content if provided
  if (html) {
    mailOptions.html = html;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to: ${to}`);
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};




