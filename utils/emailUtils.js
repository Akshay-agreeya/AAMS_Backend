const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

exports.sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, // SMTP host, e.g., "smtp.example.com"
    port: process.env.SMTP_PORT, // SMTP port, typically 587 for TLS or 465 for SSL
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL,
    to,
    subject,
    text
  });
};
