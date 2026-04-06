

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
