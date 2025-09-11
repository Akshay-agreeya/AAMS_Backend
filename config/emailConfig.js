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












// // emailConfig.js - Corporate account specific configurations
// const nodemailer = require("nodemailer");
// require("dotenv").config();

// console.log("🚀 Email config:");
// console.log("EMAIL:", process.env.EMAIL);
// console.log("PASS length:", process.env.EMAIL_PASSWORD?.length);

// // Corporate-specific configurations to try
// const corporateConfigs = [
//   {
//     name: "Exchange Online",
//     config: {
//       host: 'outlook.office365.com',
//       port: 587,
//       secure: false,
//       auth: {
//         user: process.env.EMAIL,
//         pass: process.env.EMAIL_PASSWORD,
//       },
//       tls: {
//         ciphers: 'SSLv3',
//         rejectUnauthorized: false
//       }
//     }
//   },
//   {
//     name: "Outlook with STARTTLS",
//     config: {
//       host: 'smtp-mail.outlook.com',
//       port: 587,
//       secure: false,
//       requireTLS: true,
//       auth: {
//         user: process.env.EMAIL,
//         pass: process.env.EMAIL_PASSWORD,
//       },
//       tls: {
//         rejectUnauthorized: false
//       }
//     }
//   },
//   {
//     name: "Office365 SSL",
//     config: {
//       host: 'smtp.office365.com',
//       port: 465,
//       secure: true,
//       auth: {
//         user: process.env.EMAIL,
//         pass: process.env.EMAIL_PASSWORD,
//       }
//     }
//   }
// ];

// // Mock transporter for fallback
// const createMockTransporter = () => ({
//   sendMail: async (mailOptions) => {
//     console.log("\n📧 MOCK EMAIL (Corporate SMTP Blocked):");
//     console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
//     console.log("To:", mailOptions.to);
//     console.log("Subject:", mailOptions.subject);
//     console.log("From:", mailOptions.from);
//     console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
//     return { messageId: 'mock-' + Date.now() };
//   },
//   verify: (callback) => {
//     console.log("⚠️ Corporate email blocked - using mock service");
//     if (callback) callback(null, true);
//   }
// });

// // Try configurations in sequence
// let transporter = null;

// const initializeEmail = async () => {
//   for (const { name, config } of corporateConfigs) {
//     try {
//       console.log(`🔄 Trying ${name}...`);
//       const testTransporter = nodemailer.createTransporter(config);
      
//       // Quick verification test
//       await new Promise((resolve, reject) => {
//         const timeout = setTimeout(() => {
//           reject(new Error('Connection timeout'));
//         }, 10000); // 10 second timeout
        
//         testTransporter.verify((error, success) => {
//           clearTimeout(timeout);
//           if (error) {
//             console.log(`❌ ${name} failed:`, error.message);
//             reject(error);
//           } else {
//             console.log(`✅ ${name} works!`);
//             transporter = testTransporter;
//             resolve(success);
//           }
//         });
//       });
      
//       break; // Success, stop trying
      
//     } catch (error) {
//       continue; // Try next configuration
//     }
//   }
  
//   if (!transporter) {
//     console.log("⚠️ All corporate email configs failed - using mock service");
//     transporter = createMockTransporter();
//     transporter.verify();
//   }
// };

// // Initialize with a default and then try others
// transporter = createMockTransporter();

// // Try to find working config (don't block app startup)
// initializeEmail().catch(() => {
//   console.log("🔄 Email initialization failed - continuing with mock service");
// });

// module.exports = transporter;









// // emailConfig.js - Try multiple Outlook configurations
// const nodemailer = require("nodemailer");
// require("dotenv").config();

// console.log("🚀 Email config:");
// console.log("EMAIL:", process.env.EMAIL);
// console.log("PASS length:", process.env.EMAIL_PASSWORD?.length);

// // Multiple configuration options to try
// const outlookConfigs = [
//   {
//     name: "Office 365",
//     config: {
//       host: 'smtp.office365.com',
//       port: 587,
//       secure: false,
//       auth: {
//         user: "akshay.tanwar@agreeya.com",
//         pass: "cssnybflmtwvfbxm",
//       },
//       tls: {
//         rejectUnauthorized: false
//       }
//     }
//   },
//   {
//     name: "Outlook Service",
//     config: {
//       service: 'hotmail',
//       auth: {
//         user: "akshay.tanwar@agreeya.com",
//         pass: "cssnybflmtwvfbxm",
//       }
//     }
//   },
//   {
//     name: "Outlook SMTP",
//     config: {
//       host: 'smtp-mail.outlook.com',
//       port: 587,
//       secure: false,
//       auth: {
//         user: "akshay.tanwar@agreeya.com",
//         pass: "cssnybflmtwvfbxm",
//       },
//       tls: {
//         ciphers: 'SSLv3',
//         rejectUnauthorized: false
//       }
//     }
//   },
//   {
//     name: "Outlook Port 25",
//     config: {
//       host: 'smtp-mail.outlook.com',
//       port: 25,
//       secure: false,
//       auth: {
//         user: "akshay.tanwar@agreeya.com",
//         pass: "cssnybflmtwvfbxm",
//       },
//       tls: {
//         rejectUnauthorized: false
//       }
//     }
//   }
// ];

// let transporter = null;
// let workingConfig = null;

// // Try each configuration
// const tryConfigurations = async () => {
//   for (let i = 0; i < outlookConfigs.length; i++) {
//     const { name, config } = outlookConfigs[i];
//     console.log(`🔄 Trying ${name} configuration...`);
    
//     try {
//       const testTransporter = nodemailer.createTransport(config);
      
//       // Test the configuration with a promise
//       await new Promise((resolve, reject) => {
//         testTransporter.verify((error, success) => {
//           if (error) {
//             console.log(`❌ ${name} failed:`, error.message);
//             reject(error);
//           } else {
//             console.log(`✅ ${name} configuration works!`);
//             transporter = testTransporter;
//             workingConfig = name;
//             resolve(success);
//           }
//         });
//       });
      
//       // If we get here, this configuration worked
//       break;
      
//     } catch (error) {
//       console.log(`❌ ${name} configuration failed`);
//       continue;
//     }
//   }
  
//   // If no configuration worked, create a mock transporter
//   if (!transporter) {
//     console.log("⚠️ No email configuration worked. Using mock email service.");
//     transporter = createMockTransporter();
//   }
// };

// // Mock transporter for fallback
// const createMockTransporter = () => ({
//   sendMail: async (mailOptions) => {
//     console.log("📧 Mock email (email service unavailable):");
//     console.log(`To: ${mailOptions.to}`);
//     console.log(`Subject: ${mailOptions.subject}`);
//     console.log("✅ Mock email logged successfully");
//     return { messageId: 'mock-' + Date.now() };
//   },
//   verify: (callback) => {
//     console.log("⚠️ Using mock email service - no actual emails will be sent");
//     if (callback) callback(null, true);
//   }
// });

// // Initialize with default config first, then try others
// transporter = nodemailer.createTransport(outlookConfigs[0].config);

// // Try configurations asynchronously
// tryConfigurations().catch(() => {
//   console.log("🔄 All configurations failed. Using mock service.");
//   transporter = createMockTransporter();
// });

// module.exports = transporter;












// // emailConfig.js - Corporate Outlook Configuration
// const nodemailer = require("nodemailer");
// require("dotenv").config();

// console.log("🚀 Email config:");
// console.log("EMAIL:", process.env.EMAIL);
// console.log("PASS length:", process.env.EMAIL_PASSWORD?.length);

// // For corporate emails, try different configurations
// const createCorporateTransporter = () => {
//   // Option 1: Standard Office 365
//   const option1 = {
//     host: 'smtp.office365.com',
//     port: 587,
//     secure: false,
//     auth: {
//       user: process.env.EMAIL,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//     tls: {
//       ciphers: 'SSLv3',
//       rejectUnauthorized: false
//     }
//   };

//   // Option 2: Exchange Online
//   const option2 = {
//     host: 'smtp-mail.outlook.com',
//     port: 587,
//     secure: false,
//     auth: {
//       user: process.env.EMAIL,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//     tls: {
//       rejectUnauthorized: false,
//       minVersion: 'TLSv1.2'
//     }
//   };

//   // Option 3: Service-based (let nodemailer handle the details)
//   const option3 = {
//     service: 'hotmail',
//     auth: {
//       user: process.env.EMAIL,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//     tls: {
//       rejectUnauthorized: false
//     }
//   };

//   // Try each option - start with the most specific
//   return nodemailer.createTransport(option1);
// };

// const transporter = createCorporateTransporter();

// // Enhanced connection test with better error handling
// transporter.verify((error, success) => {
//   if (error) {
//     console.error("❌ Email configuration error:", error.message);
//     console.log("💡 This might be a corporate email requiring special authentication");
//     console.log("💡 Consider asking your IT team about SMTP settings for", process.env.EMAIL);
    
//     // Don't crash the app - just log the error
//     console.log("⚠️ Email service disabled - app will continue without email functionality");
//   } else {
//     console.log("✅ Email server is ready to send messages");
//   }
// });

// module.exports = transporter;






// // emailConfig.js - Updated for Outlook
// const nodemailer = require("nodemailer");
// require("dotenv").config();

// console.log("🚀 Email config:");
// console.log("EMAIL:", process.env.EMAIL);
// console.log("PASS length:", process.env.EMAIL_PASSWORD?.length);
// console.log("HOST:", process.env.SMTP_HOST);
// console.log("PORT:", process.env.SMTP_PORT);
// console.log("SECURE:", process.env.SMTP_SECURE);

// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: Number(process.env.SMTP_PORT),
//   secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
//   auth: {
//     user: process.env.EMAIL, // Use environment variable instead of hardcoded
//     pass: process.env.EMAIL_PASSWORD, // Use environment variable instead of hardcoded
//   },
//   tls: {
//     ciphers: 'SSLv3',
//     rejectUnauthorized: false // Add this for Outlook compatibility
//   }
// });

// // Test the connection
// transporter.verify((error, success) => {
//   if (error) {
//     console.error("❌ Email configuration error:", error);
//   } else {
//     console.log("✅ Email server is ready to send messages");
//   }
// });

// module.exports = transporter;







// const nodemailer = require("nodemailer");
// require("dotenv").config();

// console.log("🚀 Email config:");
// console.log("EMAIL fee:", process.env.EMAIL);
// console.log("PASS length:", process.env.EMAIL_PASSWORD?.length);
// console.log("HOST:", process.env.SMTP_HOST);
// console.log("PORT:", process.env.SMTP_PORT);
// console.log("SECURE:", process.env.SMTP_SECURE);

// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: Number(process.env.SMTP_PORT),
//   secureConnection: process.env.SMTP_SECURE, // use true for 465, false for 587
//   auth: {
//     user: "akshay.tanwar70y@gmail.com",
//     pass: "wsnolnfwqvskvuvl",
//   },
//   tls: {
//     ciphers: 'SSLv3'
//   }
  
// });

// module.exports = transporter;










// const nodemailer = require("nodemailer");
// require("dotenv").config();

// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: process.env.SMTP_PORT,
//   secure: process.env.SMTP_SECURE === "true",
//   auth: {
//     user: process.env.EMAIL,
//     pass: process.env.EMAIL_PASSWORD,
//   },
// });

// module.exports = transporter;
