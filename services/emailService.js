const transporter = require("../config/emailConfig");

exports.sendWelcomeEmail = async ({ first_name, email, password }) => {
  try {
    await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'AAMS'}" <${process.env.EMAIL}>`,
      to: email,
      subject: "Welcome to AAMS",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome, ${first_name}!</h2>
          <p>Your account has been created successfully on <b>AAMS</b>.</p>
           <p>You can now log in using your email: http://gdc-vm-adaclient:8080/ using your password : ${password}</p>

          <p style="margin-top: 20px;">
            Best regards,<br>
            The AAMS Team
          </p>
        </div>
      `,
    });
    console.log("Welcome email sent to:", email);
    return { success: true, message: "Email sent successfully" };
  } catch (err) {
    console.error("Error sending welcome email:", err.message);
    
    // Don't throw error - just log it and return failure status
    return { 
      success: false, 
      message: "Email sending failed", 
      error: err.message 
    };
  }
};