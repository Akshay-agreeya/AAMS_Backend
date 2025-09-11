// require("dotenv").config();
// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: process.env.SMTP_PORT,
//   secure: process.env.SMTP_SECURE === "true",
//   auth: {
//     user: process.env.EMAIL,
//     pass: process.env.EMAIL_PASSWORD,
//   },
// });

// async function sendTest() {
//   try {
//     let info = await transporter.sendMail({
//       from: `"${process.env.FROM_NAME}" <${process.env.EMAIL}>`,
//       to: "your.personal.email@gmail.com",
//       subject: "Test Email",
//       text: "If you see this, Gmail SMTP works!",
//     });

//     console.log("✅ Test Email Sent:", info.messageId);
//   } catch (err) {
//     console.error("❌ Email Error:", err);
//   }
// }

// sendTest();



require("dotenv").config();
const transporter = require("./config/emailConfig");

async function testMail() {
  try {
    let info = await transporter.sendMail({
      from: `"AAMS Test" <${process.env.EMAIL}>`,
      to: process.env.EMAIL, // send to yourself
      subject: "SMTP Test ✅",
      text: "If you see this, SMTP is working!",
    });
    console.log("✅ Sent:", info.messageId);
  } catch (err) {
    console.error("❌ Failed:", err);
  }
}

testMail();
