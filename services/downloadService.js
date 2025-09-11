const fs = require("fs");
const path = require("path");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const ImageModule = require("docxtemplater-image-module-free");
const puppeteer = require("puppeteer");
const handlebars = require("handlebars");
const { generateScoreCardImage, formattedDate, replaceLinks } = require("../utils/helper");
const { getSummaryDetailReportService } = require("./dashboardService");
const { getCategoryDataService } = require("./reportsService");
const { getManualReportService } = require("../services/manualServce");
const { AppError } = require("../middlewares/errorHandler");

// ------------------ HANDLEBARS HELPERS ------------------
handlebars.registerHelper("ifEquals", function (arg1, arg2, options) {
  return arg1 == arg2 ? options.fn(this) : options.inverse(this);
});

handlebars.registerHelper("renderImage", function (imageData) {
  if (imageData) {
    return new handlebars.SafeString(
      `<img src="${imageData}" alt="Audit Score" style="max-width: 100%; height: auto;">`
    );
  }
  return "";
});

// ------------------ PDF GENERATION (PUPPETEER) ------------------
const generatePDFFromHTML = async (htmlTemplate, data) => {
  try {
    console.log("Starting HTML to PDF conversion with Puppeteer...");

    // Compile with Handlebars
    const template = handlebars.compile(htmlTemplate);
    const html = template(data);
    debugger

    // Launch Chromium
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // Inject HTML
    await page.setContent(html, {
      waitUntil: ["load", "domcontentloaded", "networkidle0"],
    });

    // Create PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      // margin: { top: "0.5in", right: "0.5in", bottom: "0.5in", left: "0.5in" },
    });

    await browser.close();
    console.log("PDF created successfully with Puppeteer");
    return pdfBuffer;
  } catch (error) {
    console.error("Puppeteer PDF error:", error);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
};

// ------------------ DATA MAPPER ------------------
const mapDataForTemplate = (summaryRows, categoryRows, manualReport = null) => {
  const accessibilityOnly = categoryRows.contents.filter(
    (item) => item.category_report_name === "Accessibility"
  );

  const auditScore = summaryRows.accessibility_score || 0;
  const text =
    auditScore >= 95
      ? "Your product is ADA Compliant"
      : "Score above 95% ensures ADA compliant";

  let base64 = null;
  try {
    const base64WithPrefix = generateScoreCardImage(auditScore, text, 600, 350);
    base64 = base64WithPrefix.split(",")[1];
  } catch (imgError) {
    console.warn("Score card image generation failed:", imgError);
  }

  return {
    org_name: categoryRows.accessibilityInfo?.org_name || "Unknown Organization",
    product_name: categoryRows.accessibilityInfo?.web_url || "N/A",
    project_manager: "Project Manager",
    access_tester: "Accessibility Tester",
    testing_device: "Desktop/Mobile Testing Environment",
    test_environment: "Production Environment",
    wcag_standard: categoryRows.accessibilityInfo?.level || "WCAG 2.1 AA",
    wcag: categoryRows.accessibilityInfo?.guideline || "WCAG 2.1",
    level: categoryRows.accessibilityInfo?.level?.split(" ")[2] || "AA",
    start_date: formattedDate(
      new Date(categoryRows.accessibilityInfo.assessment_timestamp),
      "MM-dd-yyyy"
    ),
    end_date: formattedDate(new Date(), "MM-dd-yyyy"),
    link_product_name: categoryRows.accessibilityInfo?.web_url || "N/A",

    summary_data: [
      {
        category: "Accessibility Issues",
        pages: accessibilityOnly.length.toString(),
        benchmark: "0 (Target)",
      },
      {
        category: "Total Pages Scanned",
        pages: categoryRows.accessibilityInfo?.total_pages || "1",
        benchmark: "All Pages",
      },
      {
        category: "Compliance Level",
        pages: categoryRows.accessibilityInfo?.level || "WCAG 2.1 AA",
        benchmark: "100%",
      },
    ],

    audit_score: base64 ? `data:image/png;base64,${base64}` : null,

    issues: accessibilityOnly.map((issue) => ({
      criteria: issue.criteria || "N/A",
      description: issue.issue_description || "No description available",
      remediation:
        issue.category_details?.[0]?.remediation ||
        "Remediation details not available",
      level: issue.level || "A",
      failing_page: issue.failing_page_count
        ? `${issue.failing_page_count} page(s)`
        : "1 page",
      guideline: issue.guideline || "N/A",
      pages:
        issue.category_details?.map((pageDetail) => ({
          link: pageDetail.page_url || "N/A",
          details:
            pageDetail.page_details?.map((detail) => ({
              description: detail.description || "Issue description",
              lines: detail.line_numbers || "N/A",
            })) || [
              {
                description: issue.issue_description || "Issue found on page",
                lines: "N/A",
              },
            ],
        })) || [
          {
            link: issue.failing_page || "N/A",
            details: [
              {
                description: issue.issue_description || "Issue found",
                lines: "N/A",
              },
            ],
          },
        ],
    })),
  };
};

// ------------------ PDF FUNCTIONS ------------------
exports.generateAccessibilityReportPDF = async (assessment_id) => {
  try {
    console.log("Starting PDF report generation for assessment:", assessment_id);

    const summaryRows = await getSummaryDetailReportService(assessment_id);
    const categoryRows = await getCategoryDataService(assessment_id);

    if (!summaryRows || !categoryRows) {
      throw new AppError("Report data not found", 404);
    }

    const reportData = mapDataForTemplate(summaryRows, categoryRows);
    console.log("Report data prepared, issues count:", reportData.issues.length);

    const templatePath = path.resolve(
      __dirname,
      "../templates/liteAssessment_template.html"
    );
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found at: ${templatePath}`);
    }

    const htmlTemplate = fs.readFileSync(templatePath, "utf8");
    const pdfBuffer = await generatePDFFromHTML(htmlTemplate, reportData);

    return {
      filename: `accessibility-report-${assessment_id}.pdf`,
      buffer: pdfBuffer,
    };
  } catch (err) {
    console.error("PDF generation failed:", err);
    throw new AppError(`Failed to generate PDF report: ${err.message}`, 500);
  }
};

exports.generateManualAccessibilityReportPDF = async (txn_id) => {
  try {
    console.log("Starting manual PDF report generation for txn_id:", txn_id);

    const manualReport = await getManualReportService(txn_id);
    if (!manualReport) {
      throw new AppError("Report data not found", 404);
    }

    const reportData = {
      org_name: manualReport.reportInfo?.org_name || "Unknown Organization",
      product_name: manualReport.reportInfo?.web_url || "N/A",
      project_manager: "Manual Assessment Team",
      access_tester: "Manual Tester",
      testing_device: "Manual Testing Environment",
      test_environment: "Manual Review",
      wcag_standard: "WCAG 2.1 AA",
      wcag: "WCAG 2.1",
      level: "AA",
      start_date: formattedDate(
        new Date(manualReport.reportInfo?.start_date),
        "MM-dd-yyyy"
      ),
      end_date: formattedDate(
        new Date(manualReport.reportInfo?.end_date),
        "MM-dd-yyyy"
      ),
      link_product_name: manualReport.reportInfo?.web_url || "N/A",
      summary_data: [
        {
          category: "Manual Review Items",
          pages: manualReport.contents?.length?.toString() || "0",
          benchmark: "Complete Review",
        },
      ],
      audit_score: null,
      issues:
        manualReport?.contents?.map((content, index) => ({
          criteria: `Manual Review Item ${index + 1}`,
          description: `Manual accessibility review for: ${content.pageUrl}`,
          remediation: "Manual remediation based on findings",
          level: "AA",
          failing_page: "1 page",
          guideline: "Manual Assessment Guidelines",
          pages: [
            {
              link: content.pageUrl || "N/A",
              details:
                content.formData?.map((item) => ({
                  description: `${item.category}: ${item.description}`,
                  lines: "Manual Review",
                })) || [
                  {
                    description: "Manual review completed",
                    lines: "N/A",
                  },
                ],
            },
          ],
        })) || [],
    };

    const templatePath = path.resolve(
      __dirname,
      "../templates/liteAssessment_template.html"
    );
    const htmlTemplate = fs.readFileSync(templatePath, "utf8");
    const pdfBuffer = await generatePDFFromHTML(htmlTemplate, reportData);

    return {
      filename: `manual-accessibility-report-${txn_id}.pdf`,
      buffer: pdfBuffer,
    };
  } catch (err) {
    console.error("Manual PDF generation failed:", err);
    throw new AppError(`Failed to generate manual PDF report: ${err.message}`, 500);
  }
};

exports.generateDeepAccessibilityReportPDF = async (assessment_id, txn_id) => {
  try {
    console.log("Starting deep PDF report generation:", { assessment_id, txn_id });

    const summaryRows = await getSummaryDetailReportService(assessment_id);
    const categoryRows = await getCategoryDataService(assessment_id);
    const manualReport = await getManualReportService(txn_id);

    if (!summaryRows || !categoryRows || !manualReport) {
      throw new AppError("Report data not found", 404);
    }

    const reportData = mapDataForTemplate(summaryRows, categoryRows, manualReport);

    const manualIssues =
      manualReport?.contents?.map((content, index) => ({
        criteria: `Manual Review Item ${index + 1}`,
        description: `Manual accessibility review for: ${content.pageUrl}`,
        remediation: "Manual remediation based on findings",
        level: "AA",
        failing_page: "1 page",
        guideline: "Manual Assessment Guidelines",
        pages: [
          {
            link: content.pageUrl || "N/A",
            details:
              content.formData?.map((item) => ({
                description: `${item.category}: ${item.description}`,
                lines: "Manual Review",
              })) || [
                {
                  description: "Manual review completed",
                  lines: "N/A",
                },
              ],
          },
        ],
      })) || [];

    reportData.issues = [...reportData.issues, ...manualIssues];
    reportData.end_date = formattedDate(
      new Date(manualReport.reportInfo.end_date),
      "MM-dd-yyyy"
    );

    const templatePath = path.resolve(
      __dirname,
      "../templates/liteAssessment_template.html"
    );
    const htmlTemplate = fs.readFileSync(templatePath, "utf8");
    const pdfBuffer = await generatePDFFromHTML(htmlTemplate, reportData);

    return {
      filename: `deep-accessibility-report-${assessment_id}-${txn_id}.pdf`,
      buffer: pdfBuffer,
    };
  } catch (err) {
    console.error("Deep PDF generation failed:", err);
    throw new AppError(`Failed to generate deep PDF report: ${err.message}`, 500);
  }
};

// ------------------ DOCX FUNCTIONS (unchanged) ------------------
// (keeping your generateAccessibilityReport, generateManualAccessibilityReport, generateDeepAccessibilityReport unchanged)


// Keep existing DOCX functions unchanged
exports.generateAccessibilityReport = async (assessment_id) => {
  try {
    // Fetch data from services
    const summaryRows = await getSummaryDetailReportService(assessment_id);
    const categoryRows = await getCategoryDataService(assessment_id);
    const accessibilityOnly = categoryRows.contents.filter(
      item => item.category_report_name === "Accessibility"
    );

    if (!summaryRows || !categoryRows) {
      throw new AppError("Report data not found", 404);
    }

    const auditScore = summaryRows.accessibility_score || 0;
    const text =
      auditScore >= 95
        ? "Your product is ADA Compliant"
        : "Score above 95% ensures ADA compliant";

    const base64WithPrefix = generateScoreCardImage(auditScore, text, 600, 350);
    const base64 = base64WithPrefix.split(",")[1];

    const reportData = {
      org_name: categoryRows.accessibilityInfo?.org_name || "Unknown Org",
      project_manager: "NA",
      product_name: categoryRows.accessibilityInfo?.web_url || "N/A",
      link_product_name: `{link_product_name}`,
      linkObj: {
        url: categoryRows.accessibilityInfo?.web_url || "" ,
        text:categoryRows.accessibilityInfo?.web_url || "" ,
      },
      web_url: categoryRows.accessibilityInfo?.web_url || "N/A",
      access_tester: "NA",
      testing_device: "System",
      test_environment: "NA",
      wcag_standard: categoryRows.accessibilityInfo?.level,
      wcag: categoryRows.accessibilityInfo?.guideline,
      level: categoryRows.accessibilityInfo?.level || "WCAG 2.1 AA",
      start_date: formattedDate(new Date(categoryRows.accessibilityInfo.assessment_timestamp), "MM-dd-yyyy") || "",
      end_date: formattedDate(new Date(categoryRows.accessibilityInfo.assessment_timestamp), "MM-dd-yyyy") || "",
      issues: accessibilityOnly.map((issue) => ({
        criteria: issue.criteria || "",
        description: issue.issue_description || "",
        remediation: issue.category_details?.[0]?.remediation,
        level: issue.level || "A",
        failing_page: issue.failing_page || "",
        guideline: issue.guideline || "",
        pages: issue?.category_details?.map((pItem, index) => ({
          link: `{link_${index}}`,
          linkObj: {
            url: pItem.page_url,
            text: pItem.page_url,
          },
          details: pItem?.page_details?.map((pageItem, index)=>({
            description: pageItem.description,
            lines: pageItem.line_numbers
          }))
          
        })),
      })),
      summary_data: summaryRows.contents || [],
      audit_score: base64,
    };
    
    // Load and populate DOCX template
    const templatePath = path.resolve(
      __dirname,
      "../templates/liteAssessment_template.docx"
    );
    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);

    const imageOpts = {
      getImage: (tagValue) => Buffer.from(tagValue, "base64"),
      getSize: () => [600, 350],
    };

    const imageModule = new ImageModule(imageOpts);

    const doc = new Docxtemplater(zip, {
      modules: [imageModule],
    });

    doc.render(reportData);
    
    const linkReplacementData = {
      linkObj: reportData.linkObj,
      issues: reportData.issues.map(issue => ({
        ...issue,
        pages: issue.pages.map(page => ({
          ...page,
          link: page.linkObj
        }))
      }))
    };

    replaceLinks(doc, linkReplacementData);

    const buffer = doc.getZip().generate({ type: "nodebuffer" });

    return {
      filename: `accessibility-report-${assessment_id}.docx`,
      buffer,
    };
  } catch (err) {
    console.error("DOCX generation failed:", err);
    throw new AppError("Failed to generate report", 500);
  }
};

exports.generateManualAccessibilityReport = async (txn_id) => {
  try {
    const manualReport = await getManualReportService(txn_id);
  
    if (!manualReport) {
      throw new AppError("Report data not found", 404);
    }
    
    const manualData = {
      org_name: manualReport.reportInfo?.org_name || "Unknown Org",
      project_manager: "NA",
      product_name: manualReport.reportInfo?.web_url || "N/A",
      link_product_name: `{link_product_name}`,
      linkObj: {
        url: manualReport.reportInfo?.web_url || "",
        text: manualReport.reportInfo?.web_url || "",
      },
      web_url: manualReport.reportInfo?.web_url || "N/A",
      access_tester: "NA",
      testing_device: "System",
      test_environment: "NA",
      start_date: formattedDate(new Date(manualReport.reportInfo?.start_date), "MM-dd-yyyy") || "",
      end_date: formattedDate(new Date(manualReport.reportInfo?.end_date), "MM-dd-yyyy") || "",
      contents: manualReport?.contents.map((content) => ({
        page_url: content.pageUrl || "",
        formData: content?.formData?.map((item) => ({
          category: item.category || "",
          description: item.description || "",
          user_impact: item.user_impact || "",
          conditions: item.conditions?.map((c_item) => ({
            condition: c_item.condition || "",
            remediation: c_item.remidiation || "",
            status: c_item.status || ""
          })) || []
        })) || []
      })) || []
    };
    
    const templatePath = path.resolve(
      __dirname,
      "../templates/manualAssessment_template.docx"
    );
    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);

    const imageOpts = {
      getImage: (tagValue) => Buffer.from(tagValue, "base64"),
      getSize: () => [600, 350],
    };

    const imageModule = new ImageModule(imageOpts);
    const doc = new Docxtemplater(zip, { modules: [imageModule] });

    doc.render(manualData);
    
    const linkReplacementData = { linkObj: manualData.linkObj };
    replaceLinks(doc, linkReplacementData);

    const buffer = doc.getZip().generate({ type: "nodebuffer" });

    return {
      filename: `manual-accessibility-report-${txn_id}.docx`,
      buffer,
    };
  } catch (err) {
    console.error("DOCX generation failed:", err);
    throw new AppError("Failed to generate report", 500);
  }
};

exports.generateDeepAccessibilityReport = async (assessment_id, txn_id) => {
  try {
    const summaryRows = await getSummaryDetailReportService(assessment_id);
    const categoryRows = await getCategoryDataService(assessment_id);
    const manualReport = await getManualReportService(txn_id);

    if (!summaryRows || !categoryRows || !manualReport) {
      throw new AppError("Report data not found", 404);
    }
    
    const accessibilityOnly = categoryRows.contents.filter(
      item => item.category_report_name === "Accessibility"
    );

    const auditScore = summaryRows.accessibility_score || 0;
    const text =
      auditScore >= 95
        ? "Your product is ADA Compliant"
        : "Score above 95% ensures ADA compliant";

    const base64WithPrefix = generateScoreCardImage(auditScore, text, 600, 350);
    const base64 = base64WithPrefix.split(",")[1];

    const reportData = {
      org_name: categoryRows.accessibilityInfo?.org_name || "Unknown Org",
      project_manager: "NA",
      product_name: categoryRows.accessibilityInfo?.web_url || "N/A",
      link_product_name: `{link_product_name}`,
      linkObj: {
        url: categoryRows.accessibilityInfo?.web_url || "" ,
        text:categoryRows.accessibilityInfo?.web_url || "" ,
      },
      web_url: categoryRows.accessibilityInfo?.web_url || "N/A",
      access_tester: "NA",
      testing_device: "System",
      test_environment: "NA",
      wcag_standard: categoryRows.accessibilityInfo?.level,
      wcag: categoryRows.accessibilityInfo?.guideline,
      level: categoryRows.accessibilityInfo?.level || "WCAG 2.1 AA",
      start_date: formattedDate(new Date(categoryRows.accessibilityInfo.assessment_timestamp), "MM-dd-yyyy") || "",
      end_date: formattedDate(new Date(manualReport.reportInfo.end_date), "MM-dd-yyyy") || "",
      issues: accessibilityOnly.map((issue) => ({
        criteria: issue.criteria || "",
        description: issue.issue_description || "",
        remediation: issue.category_details?.[0]?.remediation,
        level: issue.level || "A",
        failing_page: issue.failing_page || "",
        guideline: issue.guideline || "",
        pages: issue?.category_details?.map((pItem, index) => ({
          link: `{link_${index}}`,
          linkObj: {
            url: pItem.page_url,
            text: pItem.page_url,
          },
          remediation: pItem.remediation || "",
          details: pItem?.page_details?.map((pageItem, index)=>({
            description: pageItem.description,
            lines: pageItem.line_numbers
          }))
        })),
      })),
      summary_data: summaryRows.contents || [],
      contents: manualReport?.contents.map((content) => ({
        page_url: content.pageUrl || "",
        formData: content?.formData?.map((item) => ({
          category: item.category || "",
          description: item.description || "",
          user_impact: item.user_impact || "",
          conditions: item.conditions?.map((c_item) => ({
            condition: c_item.condition || "",
            remediation: c_item.remidiation || "",
            status: c_item.status || ""
          })) || []
        })) || []
      })) || [],
      audit_score: base64,
    };

    const templatePath = path.resolve(
      __dirname,
      "../templates/deepAssessment_template.docx"
    );
    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);

    const imageOpts = {
      getImage: (tagValue) => Buffer.from(tagValue, "base64"),
      getSize: () => [600, 350],
    };

    const imageModule = new ImageModule(imageOpts);
    const doc = new Docxtemplater(zip, { modules: [imageModule] });

    doc.render(reportData);
    
    const linkReplacementData = {
      linkObj: reportData.linkObj,
      issues: reportData.issues.map(issue => ({
        ...issue,
        pages: issue.pages.map(page => ({
          ...page,
          link: page.linkObj
        }))
      }))
    };

    replaceLinks(doc, linkReplacementData);

    const buffer = doc.getZip().generate({ type: "nodebuffer" });

    return {
      filename: `deep-accessibility-report-${assessment_id}.docx`,
      buffer,
    };
  } catch (err) {
    console.error("DOCX generation failed:", err);
    throw new AppError("Failed to generate report", 500);
  }
};








// workignwith out design for downloadsecrvice.js









// // SOLUTION 1: Use Puppeteer to convert HTML to PDF (Recommended)
// // This allows you to create an HTML template that matches your design

// const puppeteer = require('puppeteer');

// exports.generateAccessibilityReportPDF = async (assessment_id) => {
//   try {
//     const summaryRows = await getSummaryDetailReportService(assessment_id);
//     const categoryRows = await getCategoryDataService(assessment_id);
//     const accessibilityOnly = categoryRows.contents.filter(
//       item => item.category_report_name === "Accessibility"
//     );

//     if (!summaryRows || !categoryRows) {
//       throw new AppError("Report data not found", 404);
//     }

//     const auditScore = summaryRows.accessibility_score || 0;
//     const text = auditScore >= 95 
//       ? "Your product is ADA Compliant" 
//       : "Score above 95% ensures ADA compliant";

//     const base64WithPrefix = generateScoreCardImage(auditScore, text, 600, 350);

//     // Prepare data for HTML template
//     const reportData = {
//       org_name: categoryRows.accessibilityInfo?.org_name || "Unknown Org",
//       project_manager: "NA",
//       product_name: categoryRows.accessibilityInfo?.web_url || "N/A",
//       web_url: categoryRows.accessibilityInfo?.web_url || "N/A",
//       access_tester: "NA",
//       testing_device: "System",
//       test_environment: "NA",
//       wcag_standard: categoryRows.accessibilityInfo?.level,
//       wcag: categoryRows.accessibilityInfo?.guideline,
//       level: categoryRows.accessibilityInfo?.level || "WCAG 2.1 AA",
//       start_date: formattedDate(new Date(categoryRows.accessibilityInfo.assessment_timestamp), "MM-dd-yyyy") || "",
//       end_date: formattedDate(new Date(categoryRows.accessibilityInfo.assessment_timestamp), "MM-dd-yyyy") || "",
//       issues: accessibilityOnly,
//       summary_data: summaryRows.contents || [],
//       audit_score: base64WithPrefix,
//     };

//     // Generate HTML from template
//     const html = generateHTMLTemplate(reportData);

//     // Convert HTML to PDF using Puppeteer
//     const browser = await puppeteer.launch({ 
//       headless: true,
//       args: ['--no-sandbox', '--disable-setuid-sandbox']
//     });
    
//     const page = await browser.newPage();
//     await page.setContent(html, { waitUntil: 'networkidle0' });
    
//     const pdfBuffer = await page.pdf({
//       format: 'A4',
//       margin: {
//         top: '0.5in',
//         right: '0.5in',
//         bottom: '0.5in',
//         left: '0.5in'
//       },
//       displayHeaderFooter: true,
//       headerTemplate: `
//         <div style="font-size: 10px; margin: 0 auto; color: #666;">
//           agreeya.com | Website Accessibility Audit | ${new Date().toLocaleDateString()}
//         </div>
//       `,
//       footerTemplate: `
//         <div style="font-size: 10px; margin: 0 auto; color: #666;">
//           <span class="pageNumber"></span> / <span class="totalPages"></span>
//         </div>
//       `
//     });
    
//     await browser.close();

//     return {
//       filename: `accessibility-report-${assessment_id}.pdf`,
//       buffer: pdfBuffer,
//     };
//   } catch (err) {
//     console.error("PDF generation failed:", err);
//     throw new AppError("Failed to generate PDF report", 500);
//   }
// };

// // HTML template generator function
// function generateHTMLTemplate(data) {
//   return `
// <!DOCTYPE html>
// <html>
// <head>
//     <meta charset="utf-8">
//     <style>
//         body {
//             font-family: 'Arial', sans-serif;
//             margin: 0;
//             padding: 40px;
//             color: #333;
//             line-height: 1.6;
//         }
        
//         .header {
//             text-align: center;
//             margin-bottom: 40px;
//             color: #1f4e79;
//         }
        
//         .title {
//             font-size: 28px;
//             font-weight: bold;
//             margin-bottom: 10px;
//             color: #1f4e79;
//         }
        
//         .subtitle {
//             font-size: 16px;
//             color: #666;
//             margin-bottom: 30px;
//         }
        
//         .section {
//             margin-bottom: 40px;
//             page-break-inside: avoid;
//         }
        
//         .section-title {
//             font-size: 20px;
//             font-weight: bold;
//             color: #1f4e79;
//             margin-bottom: 15px;
//             border-bottom: 2px solid #1f4e79;
//             padding-bottom: 5px;
//         }
        
//         .info-box {
//             background: #f8f9fa;
//             border: 1px solid #dee2e6;
//             border-radius: 5px;
//             padding: 20px;
//             margin: 20px 0;
//         }
        
//         .info-row {
//             display: flex;
//             margin-bottom: 10px;
//         }
        
//         .info-label {
//             font-weight: bold;
//             min-width: 150px;
//             color: #1f4e79;
//         }
        
//         .info-value {
//             flex: 1;
//         }
        
//         .table {
//             width: 100%;
//             border-collapse: collapse;
//             margin: 20px 0;
//         }
        
//         .table th {
//             background: #1f4e79;
//             color: white;
//             padding: 12px;
//             text-align: left;
//             font-weight: bold;
//         }
        
//         .table td {
//             padding: 10px;
//             border-bottom: 1px solid #dee2e6;
//             vertical-align: top;
//         }
        
//         .table tr:nth-child(even) {
//             background: #f8f9fa;
//         }
        
//         .score-image {
//             text-align: center;
//             margin: 30px 0;
//         }
        
//         .score-image img {
//             max-width: 100%;
//             height: auto;
//         }
        
//         .page-break {
//             page-break-before: always;
//         }
        
//         .bullet-point {
//             margin: 10px 0;
//             padding-left: 20px;
//         }
        
//         .bullet-point::before {
//             content: "•";
//             color: #1f4e79;
//             font-weight: bold;
//             display: inline-block;
//             width: 1em;
//             margin-left: -1em;
//         }
        
//         .contact-box {
//             background: #e3f2fd;
//             border: 1px solid #1976d2;
//             border-radius: 5px;
//             padding: 20px;
//             margin: 20px 0;
//             text-align: center;
//         }
        
//         @media print {
//             body { print-color-adjust: exact; }
//             .page-break { page-break-before: always; }
//         }
//     </style>
// </head>
// <body>
//     <!-- Cover Page -->
//     <div class="header">
//         <div style="text-align: left; margin-bottom: 40px;">
//             <strong style="color: #1f4e79; font-size: 14px;">Agreeya.com</strong>
//         </div>
        
//         <div class="title">
//             ACCESSIBILITY<br>
//             EVALUATION<br>
//             REPORT
//         </div>
        
//         <div class="subtitle">
//             Research and Improvements for ${data.product_name}
//         </div>
        
//         <div style="border: 2px solid #1f4e79; border-radius: 5px; padding: 15px; margin: 40px auto; max-width: 400px;">
//             <strong style="color: #1f4e79;">${data.web_url}</strong>
//         </div>
        
//         <div style="margin-top: 60px; color: #666;">
//             agreeya.com
//         </div>
//     </div>

//     <div class="page-break"></div>

//     <!-- Table of Contents -->
//     <div class="section">
//         <h2 class="section-title">Content</h2>
//         <div style="margin-left: 20px;">
//             <div style="display: flex; justify-content: space-between; margin: 10px 0;">
//                 <span>Project Details</span>
//                 <span>3</span>
//             </div>
//             <div style="display: flex; justify-content: space-between; margin: 10px 0;">
//                 <span>Executive Summary</span>
//                 <span>4</span>
//             </div>
//             <div style="display: flex; justify-content: space-between; margin: 10px 0;">
//                 <span>Accessibility Evaluation Standards</span>
//                 <span>5</span>
//             </div>
//             <div style="display: flex; justify-content: space-between; margin: 10px 0;">
//                 <span>Accessibility Testing Tools</span>
//                 <span>6</span>
//             </div>
//             <div style="display: flex; justify-content: space-between; margin: 10px 0;">
//                 <span>Accessibility Assessment Report</span>
//                 <span>7</span>
//             </div>
//             <div style="display: flex; justify-content: space-between; margin: 10px 0;">
//                 <span>Detail Accessibility</span>
//                 <span>8</span>
//             </div>
//             <div style="display: flex; justify-content: space-between; margin: 10px 0;">
//                 <span>A Note on Third Party Content</span>
//                 <span>15</span>
//             </div>
//             <div style="display: flex; justify-content: space-between; margin: 10px 0;">
//                 <span>What's Next?</span>
//                 <span>16</span>
//             </div>
//             <div style="display: flex; justify-content: space-between; margin: 10px 0;">
//                 <span>Reference</span>
//                 <span>18</span>
//             </div>
//         </div>
//     </div>

//     <div class="page-break"></div>

//     <!-- Project Details -->
//     <div class="section">
//         <h2 class="section-title">Project Details</h2>
//         <div class="info-box">
//             <div class="info-row">
//                 <span class="info-label">Client:</span>
//                 <span class="info-value">${data.org_name}</span>
//             </div>
//             <div class="info-row">
//                 <span class="info-label">Project:</span>
//                 <span class="info-value">${data.product_name}</span>
//             </div>
//             <div class="info-row">
//                 <span class="info-label">Test Site #:</span>
//                 <span class="info-value">1</span>
//             </div>
//             <div class="info-row">
//                 <span class="info-label">Project Manager:</span>
//                 <span class="info-value">${data.project_manager}</span>
//             </div>
//             <div class="info-row">
//                 <span class="info-label">Accessibility Tester:</span>
//                 <span class="info-value">${data.access_tester}</span>
//             </div>
//             <div class="info-row">
//                 <span class="info-label">Testing Device:</span>
//                 <span class="info-value">${data.testing_device}</span>
//             </div>
//             <div class="info-row">
//                 <span class="info-label">Test Environment:</span>
//                 <span class="info-value">${data.test_environment}</span>
//             </div>
//             <div class="info-row">
//                 <span class="info-label">WCAG2.2 Standard:</span>
//                 <span class="info-value">${data.wcag_standard}</span>
//             </div>
//             <div class="info-row">
//                 <span class="info-label">Testing Start Date:</span>
//                 <span class="info-value">${data.start_date}</span>
//             </div>
//             <div class="info-row">
//                 <span class="info-label">Report Issued Date:</span>
//                 <span class="info-value">${data.end_date}</span>
//             </div>
//         </div>
//     </div>

//     <div class="page-break"></div>

//     <!-- Executive Summary -->
//     <div class="section">
//         <h2 class="section-title">Executive Summary</h2>
//         <p>
//             The objective of the remediation report was to give overview of ${data.wcag} level ${data.level}
//             compliance of ${data.product_name}.
//         </p>
//         <p>
//             The website failed a number of Section 508 and ${data.wcag} level ${data.level} standards that will
//             adversely impact the usability of the website by persons with disabilities.
//         </p>
//         <p>
//             The Website contains serious accessibility violations, which may prevent disabled user
//             from accessing website content. The most important problems: alt text should not be an
//             image file name, Clickable controls should be keyboard accessible, Clickable controls
//             should have an ARIA role, Document title must not be blank.
//         </p>
//     </div>

//     <!-- Assessment Report -->
//     <div class="page-break"></div>
//     <div class="section">
//         <h2 class="section-title">Accessibility Assessment Report</h2>
        
//         <h3>Issue Report</h3>
//         <p>Site quality report for ${data.product_name} produced on ${data.start_date}.</p>
        
//         <h3>Summary</h3>
//         <table class="table">
//             <thead>
//                 <tr>
//                     <th>Category</th>
//                     <th>Pages</th>
//                     <th>Benchmark</th>
//                 </tr>
//             </thead>
//             <tbody>
//                 ${data.summary_data.map(item => `
//                     <tr>
//                         <td>${item.category || ''}</td>
//                         <td>${item.pages || ''}</td>
//                         <td>${item.benchmark || ''}</td>
//                     </tr>
//                 `).join('')}
//             </tbody>
//         </table>
        
//         <div class="score-image">
//             <img src="${data.audit_score}" alt="Audit Score" />
//         </div>
//     </div>

//     <!-- Detailed Issues -->
//     <div class="page-break"></div>
//     <div class="section">
//         <h2 class="section-title">Detail Accessibility</h2>
//         <p>
//             This section shows accessibility issues, indicating problems for older users, people with
//             disabilities or accessibility needs. Automated testing cannot detect all accessibility issues,
//             so should be used alongside human testing.
//         </p>
        
//         <table class="table">
//             <thead>
//                 <tr>
//                     <th>Criteria</th>
//                     <th>Description</th>
//                     <th>Remediation</th>
//                     <th>Level</th>
//                     <th>Failing Pages</th>
//                     <th>Guideline</th>
//                 </tr>
//             </thead>
//             <tbody>
//                 ${data.issues.map(issue => `
//                     <tr>
//                         <td>${issue.criteria || ''}</td>
//                         <td>${issue.issue_description || ''}</td>
//                         <td>${issue.category_details?.[0]?.remediation || ''}</td>
//                         <td>${issue.level || 'A'}</td>
//                         <td>${issue.failing_page || ''}</td>
//                         <td>${issue.guideline || ''}</td>
//                     </tr>
//                     ${issue.category_details ? issue.category_details.map(detail => `
//                         <tr style="background: #e8f4fd;">
//                             <td colspan="6">
//                                 <strong>Page URL:</strong> <a href="${detail.page_url}" target="_blank">${detail.page_url}</a>
//                                 ${detail.page_details ? detail.page_details.map(pageDetail => `
//                                     <div style="margin-top: 10px; font-size: 12px;">
//                                         <strong>Description:</strong> ${pageDetail.description || 'N/A'}<br>
//                                         <strong>Line Numbers:</strong> ${pageDetail.line_numbers || 'N/A'}
//                                     </div>
//                                 `).join('') : ''}
//                             </td>
//                         </tr>
//                     `).join('') : ''}
//                 `).join('')}
//             </tbody>
//         </table>
//     </div>

//     <!-- Footer sections -->
//     <div class="page-break"></div>
//     <div class="section">
//         <h2 class="section-title">A Note on Third Party Content</h2>
//         <p>
//             Please be aware that several third-party elements, such as iframes, forms, videos, or embedded
//             content, may not fully comply with accessibility standards. This could result in partial
//             accessibility across your website, as we are unable to modify or guarantee the accessibility of
//             external content.
//         </p>
//         <p>
//             We strongly recommend integrating all critical elements directly within the site to ensure
//             greater control over accessibility. Minimizing third-party implementations will help mitigate
//             potential compliance issues.
//         </p>
//     </div>

//     <div class="page-break"></div>
//     <div class="section">
//         <h2 class="section-title">What's Next?</h2>
//         <p>
//             We recommend that you engage us for a comprehensive, in-depth accessibility assessment of
//             your website and web application and documents (PDF, Word). This detailed assessment will go
//             beyond automated scans, providing a thorough manual review of accessibility issues and
//             offering tailored solutions for every identified problem.
//         </p>
        
//         <div class="info-box" style="background: #e3f2fd; border-color: #1976d2;">
//             <h3 style="color: #1976d2;">Step 2 – Deep Assessment</h3>
//             <h4>In-Depth Accessibility Assessment</h4>
//         </div>
        
//         <p>Our assessment process is meticulous and designed to uncover both surface-level and deeper accessibility issues that automated tools might miss. We will:</p>
        
//         <div class="bullet-point">Manually Test your web application and website for compliance with ${data.wcag} standards and ADA guidelines.</div>
//         <div class="bullet-point">Conduct a Deep Assessment that examines not only the structure and content of your documents but also interactive elements, metadata, and visual content.</div>
//         <div class="bullet-point">Assess PDFs and Word Documents to ensure that all downloadable content is fully accessible and compliant with accessibility standards.</div>
//     </div>

//     <div class="page-break"></div>
//     <div class="section">
//         <h2 class="section-title">Thanks for Your Time. Any Questions?</h2>
//         <p style="text-align: center; font-size: 18px; margin-bottom: 30px;">You can connect with us at:</p>
        
//         <div class="contact-box">
//             <div style="margin: 15px 0;"><strong>Website:</strong> https://agreeya.com/</div>
//             <div style="margin: 15px 0;"><strong>Email:</strong> sales_americas@agreeya.com</div>
//             <div style="margin: 15px 0;"><strong>Phone:</strong> +1 (916) 294-0075</div>
//         </div>
        
//         <h3 style="color: #1f4e79;">Reference</h3>
//         <p>WCAG2.2: <a href="https://www.w3.org/TR/WCAG22/" target="_blank">https://www.w3.org/TR/WCAG22/</a></p>
//     </div>
// </body>
// </html>
//   `;
// }

// // SOLUTION 2: Use PDF-lib to fill a PDF template directly
// const { PDFDocument, rgb } = require('pdf-lib');

// exports.generateAccessibilityReportPDFFromTemplate = async (assessment_id) => {
//   try {
//     // Load your existing PDF template
//     const templatePath = path.resolve(__dirname, "../templates/liteAssessment_template.pdf");
//     const existingPdfBytes = fs.readFileSync(templatePath);
    
//     // Load the PDF
//     const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
//     // Get form fields (if your PDF has fillable fields)
//     const form = pdfDoc.getForm();
    
//     // Fetch your data
//     const summaryRows = await getSummaryDetailReportService(assessment_id);
//     const categoryRows = await getCategoryDataService(assessment_id);
    
//     // Fill the form fields (you need to create fillable fields in your PDF template)
//     try {
//       form.getTextField('org_name').setText(categoryRows.accessibilityInfo?.org_name || "Unknown Org");
//       form.getTextField('product_name').setText(categoryRows.accessibilityInfo?.web_url || "N/A");
//       form.getTextField('start_date').setText(formattedDate(new Date(categoryRows.accessibilityInfo.assessment_timestamp), "MM-dd-yyyy") || "");
//       // ... fill other fields
//     } catch (fieldError) {
//       console.warn('Some form fields not found in template:', fieldError.message);
//     }
    
//     // If you don't have form fields, you can add text at specific coordinates
//     const pages = pdfDoc.getPages();
//     const firstPage = pages[0];
    
//     // Add dynamic content at specific positions
//     firstPage.drawText(categoryRows.accessibilityInfo?.org_name || "Unknown Org", {
//       x: 200,
//       y: 600,
//       size: 12,
//       color: rgb(0, 0, 0),
//     });
    
//     const pdfBytes = await pdfDoc.save();
    
//     return {
//       filename: `accessibility-report-${assessment_id}.pdf`,
//       buffer: Buffer.from(pdfBytes),
//     };
//   } catch (err) {
//     console.error("PDF template filling failed:", err);
//     throw new AppError("Failed to generate PDF from template", 500);
//   }
// };

// // SOLUTION 3: Convert DOCX to PDF using LibreOffice (if available on server)
// const { exec } = require('child_process');
// const util = require('util');
// const execAsync = util.promisify(exec);

// exports.generatePDFFromDocx = async (assessment_id) => {
//   try {
//     // First generate the DOCX file using your existing function
//     const docxResult = await exports.generateAccessibilityReport(assessment_id);
    
//     // Save DOCX temporarily
//     const tempDocxPath = path.resolve(__dirname, `../temp/temp-${assessment_id}.docx`);
//     const tempPdfPath = path.resolve(__dirname, `../temp/temp-${assessment_id}.pdf`);
    
//     // Ensure temp directory exists
//     const tempDir = path.dirname(tempDocxPath);
//     if (!fs.existsSync(tempDir)) {
//       fs.mkdirSync(tempDir, { recursive: true });
//     }
    
//     fs.writeFileSync(tempDocxPath, docxResult.buffer);
    
//     // Convert DOCX to PDF using LibreOffice
//     await execAsync(`libreoffice --headless --convert-to pdf --outdir ${path.dirname(tempPdfPath)} ${tempDocxPath}`);
    
//     // Read the generated PDF
//     const pdfBuffer = fs.readFileSync(tempPdfPath);
    
//     // Clean up temp files
//     fs.unlinkSync(tempDocxPath);
//     fs.unlinkSync(tempPdfPath);
    
//     return {
//       filename: `accessibility-report-${assessment_id}.pdf`,
//       buffer: pdfBuffer,
//     };
//   } catch (err) {
//     console.error("DOCX to PDF conversion failed:", err);
//     throw new AppError("Failed to convert DOCX to PDF", 500);
//   }
// };

























// const fs = require("fs");
// const path = require("path");
// const PizZip = require("pizzip");
// const Docxtemplater = require("docxtemplater");
// const ImageModule = require("docxtemplater-image-module-free");
// const PDFDocument = require('pdfkit');
// const { generateScoreCardImage, formattedDate, replaceLinks } = require("../utils/helper");
// const { getSummaryDetailReportService } = require("./dashboardService");
// const { getCategoryDataService } = require("./reportsService");
// const { getManualReportService } = require("../services/manualServce");
// const { AppError } = require("../middlewares/errorHandler");

// // ================================
// // DOCX GENERATION FUNCTIONS (EXISTING)
// // ================================

// exports.generateAccessibilityReport = async (assessment_id) => {
//   try {
//     // Fetch data from services
//     const summaryRows = await getSummaryDetailReportService(assessment_id);
//     const categoryRows = await getCategoryDataService(assessment_id);
//     const accessibilityOnly = categoryRows.contents.filter(
//       item => item.category_report_name === "Accessibility"
//     );

//     if (!summaryRows || !categoryRows) {
//       throw new AppError("Report data not found", 404);
//     }

//     const auditScore = summaryRows.accessibility_score || 0;
//     const text =
//       auditScore >= 95
//         ? "Your product is ADA Compliant"
//         : "Score above 95% ensures ADA compliant";

//     const base64WithPrefix = generateScoreCardImage(auditScore, text, 600, 350);
//     const base64 = base64WithPrefix.split(",")[1];

//     const reportData = {
//       org_name: categoryRows.accessibilityInfo?.org_name || "Unknown Org",
//       project_manager: "NA",
//       product_name: categoryRows.accessibilityInfo?.web_url || "N/A",
//       link_product_name: `{link_product_name}`,
//       linkObj: {
//         url: categoryRows.accessibilityInfo?.web_url || "" ,
//         text:categoryRows.accessibilityInfo?.web_url || "" ,
//       },
//       web_url: categoryRows.accessibilityInfo?.web_url || "N/A",
//       access_tester: "NA",
//       testing_device: "System",
//       test_environment: "NA",
//       wcag_standard: categoryRows.accessibilityInfo?.level,
//       wcag: categoryRows.accessibilityInfo?.guideline,
//       level: categoryRows.accessibilityInfo?.level || "WCAG 2.1 AA",
//       start_date: formattedDate(new Date(categoryRows.accessibilityInfo.assessment_timestamp), "MM-dd-yyyy") || "",
//       end_date: formattedDate(new Date(categoryRows.accessibilityInfo.assessment_timestamp), "MM-dd-yyyy") || "",
//       issues: accessibilityOnly.map((issue) => ({
//         criteria: issue.criteria || "",
//         description: issue.issue_description || "",
//         remediation: issue.category_details?.[0]?.remediation,
//         level: issue.level || "A",
//         failing_page: issue.failing_page || "",
//         guideline: issue.guideline || "",
//         pages: issue?.category_details?.map((pItem, index) => ({
//           link: `{link_${index}}`,
//           linkObj: {
//             url: pItem.page_url,
//             text: pItem.page_url,
//           },
//           // remediation: pItem.remediation || "",
//           details: pItem?.page_details?.map((pageItem, index)=>({
//             description: pageItem.description,
//             lines: pageItem.line_numbers
//           }))
          
//         })),
//       })),
//       summary_data: summaryRows.contents || [],
//       audit_score: base64,
//     };
//     // Load and populate DOCX template
//     const templatePath = path.resolve(
//       __dirname,
//       "../templates/liteAssessment_template.docx"
//     );
//     const content = fs.readFileSync(templatePath, "binary");
//     const zip = new PizZip(content);

//     const imageOpts = {
//       getImage: (tagValue) => Buffer.from(tagValue, "base64"),
//       getSize: () => [600, 350],
//     };

//     const imageModule = new ImageModule(imageOpts);

//     const doc = new Docxtemplater(zip, {
//       modules: [imageModule],
//     });

//     doc.render(reportData);
//     // Then, prepare data for link replacement
//       // We need to transform our data to match the expected format for replaceLinks
//       const linkReplacementData = {
//         linkObj: reportData.linkObj,
//         issues: reportData.issues.map(issue => ({
//           ...issue,
//           pages: issue.pages.map(page => ({
//             ...page,
//             link: page.linkObj // Use the linkObj we set above
//           }))
//         }))
//       };

//       // Now replace {link} placeholders with actual hyperlinks
//       replaceLinks(doc, linkReplacementData);

//     const buffer = doc.getZip().generate({ type: "nodebuffer" });

//     return {
//       filename: `accessibility-report-${assessment_id}.docx`,
//       buffer,
//     };
//   } catch (err) {
//     console.error("DOCX generation failed:", err);
//     throw new AppError("Failed to generate report", 500);
//   }
// };

// exports.generateManualAccessibilityReport = async (txn_id) => {
//   try {
//     // Fetch data from services
//     const manualReport = await getManualReportService(txn_id);
  

//     if (!manualReport) {
//       throw new AppError("Report data not found", 404);
//     }
//     const manualData = {
//       org_name: manualReport.reportInfo?.org_name || "Unknown Org",
//       project_manager: "NA",
//       product_name: manualReport.reportInfo?.web_url || "N/A",
//       link_product_name: `{link_product_name}`,
//       linkObj: {
//         url: manualReport.reportInfo?.web_url || "",
//         text: manualReport.reportInfo?.web_url || "",
//       },
//       web_url: manualReport.reportInfo?.web_url || "N/A",
//       access_tester: "NA",
//       testing_device: "System",
//       test_environment: "NA",
//       start_date: formattedDate(new Date(manualReport.reportInfo?.start_date), "MM-dd-yyyy") || "",
//       end_date: formattedDate(new Date(manualReport.reportInfo?.end_date), "MM-dd-yyyy") || "",
//       contents: manualReport?.contents.map((content) => ({
//         page_url: content.pageUrl || "",
//         formData: content?.formData?.map((item) => ({
//           category: item.category || "",
//           description: item.description || "",
//           user_impact: item.user_impact || "",
//           conditions: item.conditions?.map((c_item) => ({
//             condition: c_item.condition || "",
//             remediation: c_item.remidiation || "",
//             status: c_item.status || ""
//           })) || []
//         })) || []
//       })) || []
//     };
    
//     // Load and populate DOCX template
//     const templatePath = path.resolve(
//       __dirname,
//       "../templates/manualAssessment_template.docx"
//     );
//     const content = fs.readFileSync(templatePath, "binary");
//     const zip = new PizZip(content);

//     const imageOpts = {
//       getImage: (tagValue) => Buffer.from(tagValue, "base64"),
//       getSize: () => [600, 350],
//     };

//     const imageModule = new ImageModule(imageOpts);

//     const doc = new Docxtemplater(zip, {
//       modules: [imageModule],
//     });

//     doc.render(manualData);
//     // Then, prepare data for link replacement
//       // We need to transform our data to match the expected format for replaceLinks
//       const linkReplacementData = {
//         linkObj: manualData.linkObj,
//       };

//       // Now replace {link} placeholders with actual hyperlinks
//       replaceLinks(doc, linkReplacementData);

//     const buffer = doc.getZip().generate({ type: "nodebuffer" });

//     return {
//       filename: `manual-accessibility-report-${txn_id}.docx`,
//       buffer,
//     };
//   } catch (err) {
//     console.error("DOCX generation failed:", err);
//     throw new AppError("Failed to generate report", 500);
//   }
// };

// exports.generateDeepAccessibilityReport = async (assessment_id, txn_id) => {
//   try {
//     // Fetch data from services
//     const summaryRows = await getSummaryDetailReportService(assessment_id);
//     const categoryRows = await getCategoryDataService(assessment_id);
//     const manualReport = await getManualReportService(txn_id);

//     if (!summaryRows || !categoryRows || !manualReport) {
//       throw new AppError("Report data not found", 404);
//     }
//     const accessibilityOnly = categoryRows.contents.filter(
//       item => item.category_report_name === "Accessibility"
//     );

//     const auditScore = summaryRows.accessibility_score || 0;
//     const text =
//       auditScore >= 95
//         ? "Your product is ADA Compliant"
//         : "Score above 95% ensures ADA compliant";

//     const base64WithPrefix = generateScoreCardImage(auditScore, text, 600, 350);
//     const base64 = base64WithPrefix.split(",")[1];

//     const reportData = {
//       org_name: categoryRows.accessibilityInfo?.org_name || "Unknown Org",
//       project_manager: "NA",
//       product_name: categoryRows.accessibilityInfo?.web_url || "N/A",
//       link_product_name: `{link_product_name}`,
//       linkObj: {
//         url: categoryRows.accessibilityInfo?.web_url || "" ,
//         text:categoryRows.accessibilityInfo?.web_url || "" ,
//       },
//       web_url: categoryRows.accessibilityInfo?.web_url || "N/A",
//       access_tester: "NA",
//       testing_device: "System",
//       test_environment: "NA",
//       wcag_standard: categoryRows.accessibilityInfo?.level,
//       wcag: categoryRows.accessibilityInfo?.guideline,
//       level: categoryRows.accessibilityInfo?.level || "WCAG 2.1 AA",
//       start_date: formattedDate(new Date(categoryRows.accessibilityInfo.assessment_timestamp), "MM-dd-yyyy") || "",
//       end_date: formattedDate(new Date(manualReport.reportInfo.end_date), "MM-dd-yyyy") || "",
//       issues: accessibilityOnly.map((issue) => ({
//         criteria: issue.criteria || "",
//         description: issue.issue_description || "",
//         remediation: issue.category_details?.[0]?.remediation,
//         level: issue.level || "A",
//         failing_page: issue.failing_page || "",
//         guideline: issue.guideline || "",
//         pages: issue?.category_details?.map((pItem, index) => ({
//           link: `{link_${index}}`,
//           linkObj: {
//             url: pItem.page_url,
//             text: pItem.page_url,
//           },
//           remediation: pItem.remediation || "",
//           details: pItem?.page_details?.map((pageItem, index)=>({
//             description: pageItem.description,
//             lines: pageItem.line_numbers
//           }))
//       })),
//     })),
//       summary_data: summaryRows.contents || [],
//       contents: manualReport?.contents.map((content) => ({
//         page_url: content.pageUrl || "",
//         formData: content?.formData?.map((item) => ({
//           category: item.category || "",
//           description: item.description || "",
//           user_impact: item.user_impact || "",
//           conditions: item.conditions?.map((c_item) => ({
//             condition: c_item.condition || "",
//             remediation: c_item.remidiation || "",
//             status: c_item.status || ""
//           })) || []
//         })) || []
//       })) || [],
//       audit_score: base64,
//     };

//     // Load and populate DOCX template
//     const templatePath = path.resolve(
//       __dirname,
//       "../templates/deepAssessment_template.docx"
//     );
//     const content = fs.readFileSync(templatePath, "binary");
//     const zip = new PizZip(content);

//     const imageOpts = {
//       getImage: (tagValue) => Buffer.from(tagValue, "base64"),
//       getSize: () => [600, 350],
//     };

//     const imageModule = new ImageModule(imageOpts);

//     const doc = new Docxtemplater(zip, {
//       modules: [imageModule],
//     });

//     doc.render(reportData);
//     // Then, prepare data for link replacement
//       // We need to transform our data to match the expected format for replaceLinks
//       const linkReplacementData = {
//         linkObj: reportData.linkObj,
//         issues: reportData.issues.map(issue => ({
//           ...issue,
//           pages: issue.pages.map(page => ({
//             ...page,
//             link: page.linkObj // Use the linkObj we set above
//           }))
//         }))
//       };

//       // Now replace {link} placeholders with actual hyperlinks
//       replaceLinks(doc, linkReplacementData);

//     const buffer = doc.getZip().generate({ type: "nodebuffer" });

//     return {
//       filename: `deep-accessibility-report-${assessment_id}.docx`,
//       buffer,
//     };
//   } catch (err) {
//     console.error("DOCX generation failed:", err);
//     throw new AppError("Failed to generate report", 500);
//   }
// };

// // ================================
// // PDF GENERATION FUNCTIONS (NEW)
// // ================================

// // exports.generateAccessibilityReportPDF = async (assessment_id) => {
// //   try {
// //     // Fetch data from services (same as DOCX version)
// //     const summaryRows = await getSummaryDetailReportService(assessment_id);
// //     const categoryRows = await getCategoryDataService(assessment_id);
// //     const accessibilityOnly = categoryRows.contents.filter(
// //       item => item.category_report_name === "Accessibility"
// //     );

// //     if (!summaryRows || !categoryRows) {
// //       throw new AppError("Report data not found", 404);
// //     }

// //     const auditScore = summaryRows.accessibility_score || 0;
// //     const text = auditScore >= 95 
// //       ? "Your product is ADA Compliant" 
// //       : "Score above 95% ensures ADA compliant";

// //     // Generate score card image (same as DOCX)
// //     const base64WithPrefix = generateScoreCardImage(auditScore, text, 600, 350);
// //     const base64 = base64WithPrefix.split(",")[1];
// //     const scoreImageBuffer = Buffer.from(base64, 'base64');

// //     // Create PDF document
// //     const doc = new PDFDocument({ margin: 50, size: 'A4' });
// //     const buffers = [];

// //     doc.on('data', buffers.push.bind(buffers));
    
// //     return new Promise((resolve, reject) => {
// //       doc.on('end', () => {
// //         const pdfBuffer = Buffer.concat(buffers);
// //         resolve({
// //           filename: `accessibility-report-${assessment_id}.pdf`,
// //           buffer: pdfBuffer,
// //         });
// //       });

// //       doc.on('error', reject);

// //       try {
// //         // Add header
// //         addPDFHeader(doc, categoryRows.accessibilityInfo);
        
// //         // Add project details
// //         addProjectDetails(doc, categoryRows.accessibilityInfo);
        
// //         // Add executive summary
// //         addExecutiveSummary(doc, categoryRows.accessibilityInfo);
        
// //         // Add accessibility evaluation standards
// //         addAccessibilityStandards(doc, categoryRows.accessibilityInfo);
        
// //         // Add score image
// //         doc.addPage();
// //         doc.fontSize(20).text('Assessment Report', 50, 50);
// //         doc.moveDown();
        
// //         try {
// //           doc.image(scoreImageBuffer, 50, doc.y, { width: 500 });
// //           doc.moveDown(15);
// //         } catch (imageError) {
// //           console.error('Error adding score image:', imageError);
// //           doc.text(`Audit Score: ${auditScore}%`, { align: 'center' });
// //           doc.moveDown();
// //         }
        
// //         // Add summary data
// //         addSummaryData(doc, summaryRows.contents);
        
// //         // Add detailed accessibility issues
// //         addDetailedIssues(doc, accessibilityOnly);
        
// //         // Add footer sections
// //         addFooterSections(doc, categoryRows.accessibilityInfo);
        
// //         doc.end();
// //       } catch (error) {
// //         reject(error);
// //       }
// //     });
// //   } catch (err) {
// //     console.error("PDF generation failed:", err);
// //     throw new AppError("Failed to generate PDF report", 500);
// //   }
// // };


// exports.generateAccessibilityReportPDF = async (assessment_id) => {
//   try {
//     // Fetch data from services (same as before)
//     const summaryRows = await getSummaryDetailReportService(assessment_id);
//     const categoryRows = await getCategoryDataService(assessment_id);
//     const accessibilityOnly = categoryRows.contents.filter(
//       item => item.category_report_name === "Accessibility"
//     );

//     if (!summaryRows || !categoryRows) {
//       throw new AppError("Report data not found", 404);
//     }

//     const auditScore = summaryRows.accessibility_score || 0;
//     const text = auditScore >= 95 
//       ? "Your product is ADA Compliant" 
//       : "Score above 95% ensures ADA compliant";

//     const base64WithPrefix = generateScoreCardImage(auditScore, text, 600, 350);
//     const base64 = base64WithPrefix.split(",")[1];
//     const scoreImageBuffer = Buffer.from(base64, 'base64');

//     // Create PDF document with enhanced styling
//     const doc = new PDFDocument({ 
//       margin: 40, 
//       size: 'A4',
//       info: {
//         Title: 'Accessibility Evaluation Report',
//         Author: 'Agreeya Solutions',
//         Subject: 'Website Accessibility Audit',
//         Keywords: 'accessibility, WCAG, audit, compliance'
//       }
//     });
    
//     const buffers = [];
//     doc.on('data', buffers.push.bind(buffers));
    
//     return new Promise((resolve, reject) => {
//       doc.on('end', () => {
//         const pdfBuffer = Buffer.concat(buffers);
//         resolve({
//           filename: `accessibility-report-${assessment_id}.pdf`,
//           buffer: pdfBuffer,
//         });
//       });

//       doc.on('error', reject);

//       try {
//         // Add styled cover page
//         addStyledCoverPage(doc, categoryRows.accessibilityInfo);
        
//         // Add table of contents
//         addTableOfContents(doc);
        
//         // Add project details with styling
//         addStyledProjectDetails(doc, categoryRows.accessibilityInfo);
        
//         // Add executive summary with styling
//         addStyledExecutiveSummary(doc, categoryRows.accessibilityInfo);
        
//         // Add accessibility standards with styling
//         addStyledAccessibilityStandards(doc, categoryRows.accessibilityInfo);
        
//         // Add assessment report with score
//         addStyledAssessmentReport(doc, scoreImageBuffer, auditScore, summaryRows.contents);
        
//         // Add detailed issues with styling
//         addStyledDetailedIssues(doc, accessibilityOnly);
        
//         // Add styled footer sections
//         addStyledFooterSections(doc, categoryRows.accessibilityInfo);
        
//         doc.end();
//       } catch (error) {
//         reject(error);
//       }
//     });
//   } catch (err) {
//     console.error("Enhanced PDF generation failed:", err);
//     throw new AppError("Failed to generate enhanced PDF report", 500);
//   }
// };

// // Enhanced helper functions with styling

// function addStyledCoverPage(doc, accessibilityInfo) {
//   // Add header with agreeya branding
//   addPageHeader(doc, true); // true for cover page
  
//   // Main title with styling
//   doc.fontSize(28)
//      .fillColor('#1f4e79')
//      .font('Helvetica-Bold')
//      .text('ACCESSIBILITY', 60, 200, { align: 'center' });
  
//   doc.fontSize(28)
//      .text('EVALUATION', { align: 'center' });
  
//   doc.fontSize(28)
//      .text('REPORT', { align: 'center' });
  
//   // Subtitle
//   doc.fontSize(16)
//      .fillColor('#333333')
//      .font('Helvetica')
//      .text(`Research and Improvements for ${accessibilityInfo?.web_url || 'N/A'}`, 60, 320, { 
//        align: 'center',
//        width: 480
//      });
  
//   // Add decorative line
//   doc.strokeColor('#1f4e79')
//      .lineWidth(2)
//      .moveTo(150, 380)
//      .lineTo(450, 380)
//      .stroke();
  
//   // Website URL in a box
//   if (accessibilityInfo?.web_url) {
//     doc.roundedRect(100, 420, 400, 40, 5)
//        .fillAndStroke('#f8f9fa', '#dee2e6');
    
//     doc.fillColor('#1f4e79')
//        .fontSize(14)
//        .font('Helvetica-Bold')
//        .text(accessibilityInfo.web_url, 120, 435);
//   }
  
//   // Add agreeya.com footer on cover
//   doc.fillColor('#666666')
//      .fontSize(12)
//      .font('Helvetica')
//      .text('agreeya.com', 60, 750, { align: 'center' });
// }

// function addTableOfContents(doc) {
//   doc.addPage();
//   addPageHeader(doc);
  
//   doc.fontSize(24)
//      .fillColor('#1f4e79')
//      .font('Helvetica-Bold')
//      .text('Content', 60, 120);
  
//   const tocItems = [
//     'Project Details',
//     'Executive Summary', 
//     'Accessibility Evaluation Standards',
//     'Accessibility Testing Tools',
//     'Accessibility Assessment Report',
//     'Detail Accessibility',
//     'A Note on Third Party Content',
//     "What's Next?",
//     'Reference'
//   ];
  
//   let yPos = 160;
//   tocItems.forEach((item, index) => {
//     doc.fontSize(12)
//        .fillColor('#333333')
//        .font('Helvetica')
//        .text(item, 80, yPos);
    
//     doc.text((index + 3).toString(), 500, yPos); // Page numbers
//     yPos += 25;
//   });
// }

// function addPageHeader(doc, isCoverPage = false) {
//   if (!isCoverPage) {
//     // Add header with website and date
//     doc.fontSize(10)
//        .fillColor('#666666')
//        .font('Helvetica')
//        .text('agreeya.com | Website Accessibility Audit | ' + new Date().toLocaleDateString(), 60, 30);
    
//     // Add page number
//     const pageNumber = doc.bufferedPageRange().count;
//     doc.text(`${pageNumber} / 16`, 500, 30);
    
//     // Add header line
//     doc.strokeColor('#cccccc')
//        .lineWidth(0.5)
//        .moveTo(60, 55)
//        .lineTo(550, 55)
//        .stroke();
//   }
  
//   // Add agreeya logo text (you can replace with actual logo image if available)
//   doc.fontSize(14)
//      .fillColor('#1f4e79')
//      .font('Helvetica-Bold')
//      .text('Agreeya.com', 60, isCoverPage ? 60 : 70);
// }

// function addStyledProjectDetails(doc, accessibilityInfo) {
//   doc.addPage();
//   addPageHeader(doc);
  
//   // Section title
//   doc.fontSize(20)
//      .fillColor('#1f4e79')
//      .font('Helvetica-Bold')
//      .text('Project Details', 60, 120);
  
//   // Create styled info box
//   doc.roundedRect(60, 160, 480, 280, 5)
//      .fillAndStroke('#f8f9fa', '#dee2e6');
  
//   const projectDetails = [
//     { label: 'Client:', value: accessibilityInfo?.org_name || "Unknown Org" },
//     { label: 'Project:', value: accessibilityInfo?.web_url || "N/A" },
//     { label: 'Test Site #:', value: '1' },
//     { label: 'Project Manager:', value: 'NA' },
//     { label: 'Accessibility Tester:', value: 'NA' },
//     { label: 'Testing Device:', value: 'System' },
//     { label: 'Test Environment:', value: 'NA' },
//     { label: 'WCAG2.2 Standard:', value: accessibilityInfo?.level || 'WCAG 2.1 AA' },
//     { label: 'Testing Start dated:', value: formattedDate(new Date(accessibilityInfo?.assessment_timestamp), "MM-dd-yyyy") || "" },
//     { label: 'Report Issued dated:', value: formattedDate(new Date(accessibilityInfo?.assessment_timestamp), "MM-dd-yyyy") || "" }
//   ];

//   let yPos = 180;
//   projectDetails.forEach(detail => {
//     doc.fontSize(12)
//        .fillColor('#333333')
//        .font('Helvetica-Bold')
//        .text(detail.label, 80, yPos);
    
//     doc.font('Helvetica')
//        .text(detail.value, 200, yPos);
    
//     yPos += 25;
//   });
// }

// function addStyledExecutiveSummary(doc, accessibilityInfo) {
//   doc.addPage();
//   addPageHeader(doc);
  
//   doc.fontSize(20)
//      .fillColor('#1f4e79')
//      .font('Helvetica-Bold')
//      .text('Executive Summary', 60, 120);
  
//   const summaryText = `The objective of the remediation report was to give overview of ${accessibilityInfo?.guideline || 'WCAG'} level ${accessibilityInfo?.level || 'AA'} compliance of ${accessibilityInfo?.web_url || 'the website'}.

// The website failed a number of Section 508 and ${accessibilityInfo?.guideline || 'WCAG'} level ${accessibilityInfo?.level || 'AA'} standards that will adversely impact the usability of the website by persons with disabilities.

// The Website contains serious accessibility violations, which may prevent disabled user from accessing website content. The most important problems: alt text should not be an image file name, Clickable controls should be keyboard accessible, Clickable controls should have an ARIA role, Document title must not be blank.`;

//   doc.fontSize(12)
//      .fillColor('#333333')
//      .font('Helvetica')
//      .text(summaryText, 60, 160, { 
//        align: 'justify',
//        width: 480,
//        lineGap: 5
//      });
// }

// function addStyledAccessibilityStandards(doc, accessibilityInfo) {
//   doc.addPage();
//   addPageHeader(doc);
  
//   doc.fontSize(20)
//      .fillColor('#1f4e79')
//      .font('Helvetica-Bold')
//      .text('Accessibility Evaluation Standards', 60, 120);
  
//   const standardsText = `Web Content Accessibility Guidelines (WCAG) are developed through the W3C process in cooperation with individuals and organizations around the world, with a goal of providing a single shared standard for web content accessibility that meets the needs of individuals, organizations, and governments internationally.

// ${accessibilityInfo?.guideline || 'WCAG'} is divided into three conformance levels (${accessibilityInfo?.level || 'AA'}) because the success criteria are organised based on the impact they have on design or visual presentation of the pages. Each level is defined based on a set of success criteria.

// This can be interpreted as follows:`;

//   doc.fontSize(12)
//      .fillColor('#333333')
//      .font('Helvetica')
//      .text(standardsText, 60, 160, { 
//        align: 'justify',
//        width: 480,
//        lineGap: 5
//      });
  
//   // Add bullet points with styling
//   const bulletPoints = [
//     'Level A - Success criteria are those which will have a high impact on a broad array of user populations. In other words, they (usually) do not focus on one type of disability alone. They will also have the lowest impact on the presentation logic and business logic of the site.',
//     'Level AA - Success criteria will also have a high impact for users. Sometimes only specific user populations will be impacted, but the impact is important. Adherence to these success criteria may impose changes to a system\'s presentation logic or business logic.'
//   ];
  
//   let yPos = 320;
//   bulletPoints.forEach(point => {
//     doc.fontSize(12)
//        .fillColor('#333333')
//        .font('Helvetica-Bold')
//        .text('•', 80, yPos);
    
//     doc.font('Helvetica')
//        .text(point, 100, yPos, { 
//          width: 440,
//          align: 'justify',
//          lineGap: 3
//        });
    
//     yPos += 80;
//   });
  
//   // Add testing tools section
//   doc.addPage();
//   addPageHeader(doc);
  
//   doc.fontSize(20)
//      .fillColor('#1f4e79')
//      .font('Helvetica-Bold')
//      .text('Accessibility Testing Tools', 60, 120);
  
//   // SortSite info box
//   doc.roundedRect(60, 160, 480, 100, 5)
//      .fillAndStroke('#e3f2fd', '#1f4e79');
  
//   doc.fontSize(16)
//      .fillColor('#1f4e79')
//      .font('Helvetica-Bold')
//      .text('SortSite', 80, 180);
  
//   doc.fontSize(12)
//      .fillColor('#333333')
//      .font('Helvetica')
//      .text('Scan your website with our accessibility checker. Test WCAG, Section 508 and ADA compliance with over 320 evidence based rules.', 80, 205, {
//        width: 440,
//        lineGap: 3
//      });
// }

// function addStyledAssessmentReport(doc, scoreImageBuffer, auditScore, summaryContents) {
//   doc.addPage();
//   addPageHeader(doc);
  
//   doc.fontSize(20)
//      .fillColor('#1f4e79')
//      .font('Helvetica-Bold')
//      .text('Accessibility Assessment Report', 60, 120);
  
//   // Site quality report info
//   doc.fontSize(14)
//      .fillColor('#333333')
//      .font('Helvetica')
//      .text('Issue Report', 60, 160);
  
//   doc.fontSize(12)
//      .text(`Site quality report produced on ${formattedDate(new Date(), "MM-dd-yyyy")}.`, 60, 185);
  
//   // Summary table with styling
//   doc.fontSize(14)
//      .font('Helvetica-Bold')
//      .text('Summary', 60, 220);
  
//   // Table headers with background
//   doc.roundedRect(60, 250, 480, 25, 3)
//      .fillAndStroke('#1f4e79', '#1f4e79');
  
//   doc.fontSize(12)
//      .fillColor('white')
//      .font('Helvetica-Bold')
//      .text('Category', 80, 260)
//      .text('Pages', 250, 260)
//      .text('Benchmark', 400, 260);
  
//   // Table rows
//   if (summaryContents && summaryContents.length > 0) {
//     let yPos = 275;
//     summaryContents.forEach((item, index) => {
//       const bgColor = index % 2 === 0 ? '#f8f9fa' : 'white';
      
//       doc.roundedRect(60, yPos, 480, 25, 3)
//          .fillAndStroke(bgColor, '#dee2e6');
      
//       doc.fontSize(11)
//          .fillColor('#333333')
//          .font('Helvetica')
//          .text(item.category || '', 80, yPos + 8)
//          .text(item.pages || '', 250, yPos + 8)
//          .text(item.benchmark || '', 400, yPos + 8);
      
//       yPos += 25;
//     });
//   }
  
//   // Add score image with border
//   try {
//     const imageY = 450;
//     doc.roundedRect(60, imageY - 10, 480, 180, 5)
//        .fillAndStroke('#f8f9fa', '#dee2e6');
    
//     doc.image(scoreImageBuffer, 130, imageY, { width: 340 });
//   } catch (imageError) {
//     console.error('Error adding score image:', imageError);
//     doc.fontSize(24)
//        .fillColor('#1f4e79')
//        .font('Helvetica-Bold')
//        .text(`Audit Score: ${auditScore}%`, 60, 500, { align: 'center' });
//   }
// }

// function addStyledDetailedIssues(doc, accessibilityIssues) {
//   if (!accessibilityIssues || accessibilityIssues.length === 0) return;
  
//   doc.addPage();
//   addPageHeader(doc);
  
//   doc.fontSize(20)
//      .fillColor('#1f4e79')
//      .font('Helvetica-Bold')
//      .text('Detail Accessibility', 60, 120);
  
//   doc.fontSize(12)
//      .fillColor('#333333')
//      .font('Helvetica')
//      .text('This section shows accessibility issues, indicating problems for older users, people with disabilities or accessibility needs. Automated testing cannot detect all accessibility issues, so should be used alongside human testing.', 60, 160, {
//        width: 480,
//        lineGap: 4
//      });
  
//   // Create table headers
//   const headers = ['Criteria', 'Description', 'Remediation', 'Level', 'Failing Pages', 'Guideline'];
//   let tableY = 220;
  
//   // Header row with background
//   doc.roundedRect(60, tableY, 480, 25, 3)
//      .fillAndStroke('#1f4e79', '#1f4e79');
  
//   doc.fontSize(10)
//      .fillColor('white')
//      .font('Helvetica-Bold');
  
//   const colWidths = [80, 120, 100, 40, 80, 60];
//   let xPos = 60;
//   headers.forEach((header, index) => {
//     doc.text(header, xPos + 5, tableY + 8, { width: colWidths[index] - 10 });
//     xPos += colWidths[index];
//   });
  
//   tableY += 25;
  
//   // Data rows
//   accessibilityIssues.forEach((issue, index) => {
//     if (tableY > 700) {
//       doc.addPage();
//       addPageHeader(doc);
//       tableY = 120;
//     }
    
//     const bgColor = index % 2 === 0 ? '#f8f9fa' : 'white';
//     const rowHeight = 60; // Fixed row height for consistent layout
    
//     doc.roundedRect(60, tableY, 480, rowHeight, 3)
//        .fillAndStroke(bgColor, '#dee2e6');
    
//     doc.fontSize(9)
//        .fillColor('#333333')
//        .font('Helvetica');
    
//     xPos = 60;
//     const cellData = [
//       issue.criteria || '',
//       issue.issue_description || '',
//       issue.category_details?.[0]?.remediation || '',
//       issue.level || 'A',
//       issue.failing_page || '',
//       issue.guideline || ''
//     ];
    
//     cellData.forEach((data, cellIndex) => {
//       doc.text(data, xPos + 3, tableY + 5, { 
//         width: colWidths[cellIndex] - 6,
//         height: rowHeight - 10,
//         ellipsis: true
//       });
//       xPos += colWidths[cellIndex];
//     });
    
//     tableY += rowHeight;
    
//     // Add page details if available
//     if (issue.category_details && issue.category_details.length > 0) {
//       issue.category_details.forEach(detail => {
//         if (tableY > 680) {
//           doc.addPage();
//           addPageHeader(doc);
//           tableY = 120;
//         }
        
//         doc.roundedRect(60, tableY, 480, 30, 3)
//            .fillAndStroke('#e8f4fd', '#bee5eb');
        
//         doc.fontSize(9)
//            .fillColor('#0c5460')
//            .font('Helvetica-Bold')
//            .text('Page URL', 80, tableY + 8);
        
//         doc.font('Helvetica')
//            .fillColor('#333333')
//            .text(detail.page_url || 'N/A', 150, tableY + 8, { width: 300 });
        
//         tableY += 30;
        
//         if (detail.page_details && detail.page_details.length > 0) {
//           detail.page_details.forEach(pageDetail => {
//             if (tableY > 700) {
//               doc.addPage();
//               addPageHeader(doc);
//               tableY = 120;
//             }
            
//             doc.fontSize(8)
//                .fillColor('#6c757d')
//                .text(`Description: ${pageDetail.description || 'N/A'}`, 100, tableY);
            
//             doc.text(`Line Numbers: ${pageDetail.line_numbers || 'N/A'}`, 100, tableY + 12);
//             tableY += 30;
//           });
//         }
//       });
//     }
    
//     tableY += 10; // Space between issues
//   });
// }

// function addStyledFooterSections(doc, accessibilityInfo) {
//   doc.addPage();
//   addPageHeader(doc);
  
//   // Third Party Content section
//   doc.fontSize(18)
//      .fillColor('#1f4e79')
//      .font('Helvetica-Bold')
//      .text('A Note on Third Party Content', 60, 120);
  
//   const thirdPartyText = `Please be aware that several third-party elements, such as iframes, forms, videos, or embedded content, may not fully comply with accessibility standards. This could result in partial accessibility across your website, as we are unable to modify or guarantee the accessibility of external content.

// We strongly recommend integrating all critical elements directly within the site to ensure greater control over accessibility. Minimizing third-party implementations will help mitigate potential compliance issues.`;

//   doc.fontSize(12)
//      .fillColor('#333333')
//      .font('Helvetica')
//      .text(thirdPartyText, 60, 160, { 
//        align: 'justify',
//        width: 480,
//        lineGap: 5
//      });
  
//   // What's Next section
//   doc.addPage();
//   addPageHeader(doc);
  
//   doc.fontSize(18)
//      .fillColor('#1f4e79')
//      .font('Helvetica-Bold')
//      .text("What's Next?", 60, 120);
  
//   const nextStepsText = `We recommend that you engage us for a comprehensive, in-depth accessibility assessment of your website and web application and documents (PDF, Word). This detailed assessment will go beyond automated scans, providing a thorough manual review of accessibility issues and offering tailored solutions for every identified problem.

// Here's what's next:`;

//   doc.fontSize(12)
//      .fillColor('#333333')
//      .font('Helvetica')
//      .text(nextStepsText, 60, 160, { 
//        align: 'justify',
//        width: 480,
//        lineGap: 5
//      });
  
//   // Step 2 section with styled box
//   doc.roundedRect(60, 250, 480, 40, 5)
//      .fillAndStroke('#e3f2fd', '#1f4e79');
  
//   doc.fontSize(16)
//      .fillColor('#1f4e79')
//      .font('Helvetica-Bold')
//      .text('Step 2 – Deep Assessment', 80, 265);
  
//   doc.fontSize(14)
//      .text('In-Depth Accessibility Assessment', 60, 310);
  
//   // Continue with more content sections...
//   addMoreDetailedSteps(doc, accessibilityInfo);
  
//   // Final page with contact info
//   addContactPage(doc);
// }

// function addMoreDetailedSteps(doc, accessibilityInfo) {
//   const stepsText = `Our assessment process is meticulous and designed to uncover both surface-level and deeper accessibility issues that automated tools might miss. We will:`;
  
//   doc.fontSize(12)
//      .fillColor('#333333')
//      .font('Helvetica')
//      .text(stepsText, 60, 340, { width: 480, lineGap: 4 });
  
//   const bulletPoints = [
//     `Manually Test your web application and website for compliance with ${accessibilityInfo?.guideline || 'WCAG'} standards and ADA guidelines.`,
//     'Conduct a Deep Assessment that examines not only the structure and content of your documents but also interactive elements, metadata, and visual content.',
//     'Assess PDFs and Word Documents to ensure that all downloadable content is fully accessible and compliant with accessibility standards. Documents are often overlooked but are critical in providing a consistent accessible experience.'
//   ];
  
//   let yPos = 380;
//   bulletPoints.forEach(point => {
//     doc.fontSize(12)
//        .fillColor('#1f4e79')
//        .font('Helvetica-Bold')
//        .text('•', 80, yPos);
    
//     doc.fillColor('#333333')
//        .font('Helvetica')
//        .text(point, 95, yPos, { 
//          width: 445,
//          align: 'justify',
//          lineGap: 3
//        });
    
//     yPos += 60;
//   });
// }

// function addContactPage(doc) {
//   doc.addPage();
//   addPageHeader(doc);
  
//   // Thank you section with styling
//   doc.fontSize(24)
//      .fillColor('#1f4e79')
//      .font('Helvetica-Bold')
//      .text('Thanks for Your Time. Any Questions?', 60, 200, { align: 'center' });
  
//   doc.fontSize(16)
//      .fillColor('#333333')
//      .font('Helvetica')
//      .text('You can connect with us at:', 60, 280, { align: 'center' });
  
//   // Contact info in styled boxes
//   const contacts = [
//     { label: 'Website:', value: 'https://agreeya.com/' },
//     { label: 'Email:', value: 'sales_americas@agreeya.com' },
//     { label: 'Phone:', value: '+1 (916) 294-0075' }
//   ];
  
//   let yPos = 320;
//   contacts.forEach(contact => {
//     doc.roundedRect(100, yPos, 400, 35, 5)
//        .fillAndStroke('#f8f9fa', '#dee2e6');
    
//     doc.fontSize(12)
//        .fillColor('#1f4e79')
//        .font('Helvetica-Bold')
//        .text(contact.label, 120, yPos + 12);
    
//     doc.fillColor('#333333')
//        .font('Helvetica')
//        .text(contact.value, 200, yPos + 12);
    
//     yPos += 50;
//   });
  
//   // Reference section
//   doc.fontSize(16)
//      .fillColor('#1f4e79')
//      .font('Helvetica-Bold')
//      .text('Reference', 60, 550);
  
//   doc.fontSize(12)
//      .fillColor('#333333')
//      .font('Helvetica')
//      .text('WCAG2.2: https://www.w3.org/TR/WCAG22/', 60, 580);
// }


// // Enhanced Manual PDF Report Generation
// exports.generateManualAccessibilityReportPDF = async (txn_id) => {
//   try {
//     const manualReport = await getManualReportService(txn_id);

//     if (!manualReport) {
//       throw new AppError("Report data not found", 404);
//     }

//     // Create PDF document with enhanced styling
//     const doc = new PDFDocument({ 
//       margin: 40, 
//       size: 'A4',
//       info: {
//         Title: 'Manual Accessibility Assessment Report',
//         Author: 'Agreeya Solutions',
//         Subject: 'Manual Website Accessibility Audit',
//         Keywords: 'accessibility, WCAG, manual audit, compliance'
//       }
//     });
    
//     const buffers = [];
//     doc.on('data', buffers.push.bind(buffers));
    
//     return new Promise((resolve, reject) => {
//       doc.on('end', () => {
//         const pdfBuffer = Buffer.concat(buffers);
//         resolve({
//           filename: `manual-accessibility-report-${txn_id}.pdf`,
//           buffer: pdfBuffer,
//         });
//       });

//       doc.on('error', reject);

//       try {
//         // Add styled cover page for manual report
//         addManualCoverPage(doc, manualReport.reportInfo);
        
//         // Add manual report content with styling
//         addStyledManualReportContent(doc, manualReport);
        
//         doc.end();
//       } catch (error) {
//         reject(error);
//       }
//     });
//   } catch (err) {
//     console.error("Manual PDF generation failed:", err);
//     throw new AppError("Failed to generate manual PDF report", 500);
//   }
// };

// // Enhanced Deep PDF Report Generation
// exports.generateDeepAccessibilityReportPDF = async (assessment_id, txn_id) => {
//   try {
//     const summaryRows = await getSummaryDetailReportService(assessment_id);
//     const categoryRows = await getCategoryDataService(assessment_id);
//     const manualReport = await getManualReportService(txn_id);

//     if (!summaryRows || !categoryRows || !manualReport) {
//       throw new AppError("Report data not found", 404);
//     }

//     const accessibilityOnly = categoryRows.contents.filter(
//       item => item.category_report_name === "Accessibility"
//     );

//     const auditScore = summaryRows.accessibility_score || 0;
//     const text = auditScore >= 95 
//       ? "Your product is ADA Compliant" 
//       : "Score above 95% ensures ADA compliant";

//     const base64WithPrefix = generateScoreCardImage(auditScore, text, 600, 350);
//     const base64 = base64WithPrefix.split(",")[1];
//     const scoreImageBuffer = Buffer.from(base64, 'base64');

//     // Create PDF document combining both reports
//     const doc = new PDFDocument({ 
//       margin: 40, 
//       size: 'A4',
//       info: {
//         Title: 'Deep Accessibility Assessment Report',
//         Author: 'Agreeya Solutions',
//         Subject: 'Comprehensive Website Accessibility Audit',
//         Keywords: 'accessibility, WCAG, deep audit, manual testing, compliance'
//       }
//     });
    
//     const buffers = [];
//     doc.on('data', buffers.push.bind(buffers));
    
//     return new Promise((resolve, reject) => {
//       doc.on('end', () => {
//         const pdfBuffer = Buffer.concat(buffers);
//         resolve({
//           filename: `deep-accessibility-report-${assessment_id}.pdf`,
//           buffer: pdfBuffer,
//         });
//       });

//       doc.on('error', reject);

//       try {
//         // Add styled cover page for deep report
//         addDeepCoverPage(doc, categoryRows.accessibilityInfo);
        
//         // Add table of contents for deep report
//         addDeepTableOfContents(doc);
        
//         // PART 1: Automated Assessment
//         doc.addPage();
//         addSectionDivider(doc, 'PART 1: AUTOMATED ASSESSMENT', '#1f4e79');
        
//         // Add automated report sections
//         addStyledProjectDetails(doc, categoryRows.accessibilityInfo);
//         addStyledExecutiveSummary(doc, categoryRows.accessibilityInfo);
//         addStyledAccessibilityStandards(doc, categoryRows.accessibilityInfo);
//         addStyledAssessmentReport(doc, scoreImageBuffer, auditScore, summaryRows.contents);
//         addStyledDetailedIssues(doc, accessibilityOnly);
        
//         // PART 2: Manual Assessment
//         doc.addPage();
//         addSectionDivider(doc, 'PART 2: MANUAL ASSESSMENT', '#28a745');
        
//         // Add manual report sections
//         addStyledManualReportContent(doc, manualReport, false);
        
//         // PART 3: Recommendations
//         doc.addPage();
//         addSectionDivider(doc, 'PART 3: RECOMMENDATIONS & NEXT STEPS', '#dc3545');
        
//         // Add combined recommendations
//         addStyledFooterSections(doc, categoryRows.accessibilityInfo);
        
//         doc.end();
//       } catch (error) {
//         reject(error);
//       }
//     });
//   } catch (err) {
//     console.error("Deep PDF generation failed:", err);
//     throw new AppError("Failed to generate deep PDF report", 500);
//   }
// };

// // Helper functions for enhanced styling

// function addManualCoverPage(doc, reportInfo) {
//   // Add header with agreeya branding
//   addPageHeader(doc, true);
  
//   // Main title with styling
//   doc.fontSize(28)
//      .fillColor('#28a745')
//      .font('Helvetica-Bold')
//      .text('MANUAL ACCESSIBILITY', 60, 180, { align: 'center' });
  
//   doc.fontSize(28)
//      .text('ASSESSMENT REPORT', { align: 'center' });
  
//   // Subtitle
//   doc.fontSize(16)
//      .fillColor('#333333')
//      .font('Helvetica')
//      .text(`Comprehensive Manual Testing for ${reportInfo?.web_url || 'N/A'}`, 60, 280, { 
//        align: 'center',
//        width: 480
//      });
  
//   // Add decorative line
//   doc.strokeColor('#28a745')
//      .lineWidth(2)
//      .moveTo(150, 340)
//      .lineTo(450, 340)
//      .stroke();
  
//   // Date range box
//   doc.roundedRect(100, 380, 400, 60, 5)
//      .fillAndStroke('#f8f9fa', '#dee2e6');
  
//   doc.fillColor('#28a745')
//      .fontSize(12)
//      .font('Helvetica-Bold')
//      .text('Assessment Period:', 120, 395);
  
//   doc.fillColor('#333333')
//      .font('Helvetica')
//      .text(`${formattedDate(new Date(reportInfo?.start_date), "MM-dd-yyyy")} to ${formattedDate(new Date(reportInfo?.end_date), "MM-dd-yyyy")}`, 120, 415);
// }

// function addDeepCoverPage(doc, accessibilityInfo) {
//   // Add header with agreeya branding
//   addPageHeader(doc, true);
  
//   // Main title with styling
//   doc.fontSize(26)
//      .fillColor('#6f42c1')
//      .font('Helvetica-Bold')
//      .text('DEEP ACCESSIBILITY', 60, 180, { align: 'center' });
  
//   doc.fontSize(26)
//      .text('ASSESSMENT REPORT', { align: 'center' });
  
//   // Subtitle
//   doc.fontSize(16)
//      .fillColor('#333333')
//      .font('Helvetica')
//      .text(`Comprehensive Automated & Manual Testing`, 60, 250, { align: 'center' });
  
//   doc.fontSize(14)
//      .text(`for ${accessibilityInfo?.web_url || 'N/A'}`, 60, 275, { 
//        align: 'center',
//        width: 480
//      });
  
//   // Add decorative line
//   doc.strokeColor('#6f42c1')
//      .lineWidth(2)
//      .moveTo(150, 320)
//      .lineTo(450, 320)
//      .stroke();
  
//   // Features box
//   doc.roundedRect(80, 360, 440, 120, 5)
//      .fillAndStroke('#f8f9fa', '#dee2e6');
  
//   doc.fillColor('#6f42c1')
//      .fontSize(14)
//      .font('Helvetica-Bold')
//      .text('This Report Includes:', 100, 380);
  
//   const features = [
//     '✓ Automated WCAG 2.1/2.2 Compliance Testing',
//     '✓ Manual Accessibility Assessment',
//     '✓ Detailed Remediation Guidelines',
//     '✓ Priority-based Action Plan'
//   ];
  
//   let yPos = 405;
//   features.forEach(feature => {
//     doc.fontSize(12)
//        .fillColor('#333333')
//        .font('Helvetica')
//        .text(feature, 100, yPos);
//     yPos += 20;
//   });
// }

// function addDeepTableOfContents(doc) {
//   doc.addPage();
//   addPageHeader(doc);
  
//   doc.fontSize(24)
//      .fillColor('#6f42c1')
//      .font('Helvetica-Bold')
//      .text('Table of Contents', 60, 120);
  
//   const sections = [
//     { title: 'PART 1: AUTOMATED ASSESSMENT', page: 4, color: '#1f4e79' },
//     { title: '  Project Details', page: 5 },
//     { title: '  Executive Summary', page: 6 },
//     { title: '  Accessibility Standards', page: 7 },
//     { title: '  Assessment Results', page: 8 },
//     { title: '  Detailed Issues', page: 9 },
//     { title: 'PART 2: MANUAL ASSESSMENT', page: 12, color: '#28a745' },
//     { title: '  Manual Testing Results', page: 13 },
//     { title: '  Page-by-Page Analysis', page: 14 },
//     { title: 'PART 3: RECOMMENDATIONS', page: 16, color: '#dc3545' },
//     { title: '  Next Steps', page: 17 },
//     { title: '  Contact Information', page: 18 }
//   ];
  
//   let yPos = 170;
//   sections.forEach(section => {
//     const isMainSection = section.color;
    
//     doc.fontSize(isMainSection ? 14 : 12)
//        .fillColor(section.color || '#333333')
//        .font(isMainSection ? 'Helvetica-Bold' : 'Helvetica')
//        .text(section.title, 80, yPos);
    
//     // Add dotted line
//     if (!isMainSection) {
//       const titleWidth = doc.widthOfString(section.title);
//       const dotsStart = 80 + titleWidth + 10;
//       const dotsEnd = 480;
      
//       doc.fontSize(12)
//          .fillColor('#cccccc')
//          .text('.'.repeat(Math.floor((dotsEnd - dotsStart) / 3)), dotsStart, yPos);
//     }
    
//     doc.fontSize(12)
//        .fillColor('#333333')
//        .text(section.page.toString(), 500, yPos);
    
//     yPos += isMainSection ? 25 : 20;
//   });
// }

// function addSectionDivider(doc, title, color) {
//   addPageHeader(doc);
  
//   // Full width colored bar
//   doc.rect(0, 120, 612, 60)
//      .fillAndStroke(color, color);
  
//   doc.fontSize(20)
//      .fillColor('white')
//      .font('Helvetica-Bold')
//      .text(title, 60, 145);
// }

// function addStyledManualReportContent(doc, manualReport, addTitle = true) {
//   if (addTitle) {
//     doc.addPage();
//     addPageHeader(doc);
    
//     doc.fontSize(20)
//        .fillColor('#28a745')
//        .font('Helvetica-Bold')
//        .text('Manual Accessibility Assessment', 60, 120);
//   }
  
//   // Report info box
//   doc.roundedRect(60, 160, 480, 120, 5)
//      .fillAndStroke('#e8f5e8', '#28a745');
  
//   doc.fontSize(14)
//      .fillColor('#28a745')
//      .font('Helvetica-Bold')
//      .text('Assessment Information', 80, 180);
  
//   const reportDetails = [
//     { label: 'Website:', value: manualReport.reportInfo?.web_url || 'N/A' },
//     { label: 'Organization:', value: manualReport.reportInfo?.org_name || 'Unknown Org' },
//     { label: 'Assessment Period:', value: `${formattedDate(new Date(manualReport.reportInfo?.start_date), "MM-dd-yyyy")} - ${formattedDate(new Date(manualReport.reportInfo?.end_date), "MM-dd-yyyy")}` }
//   ];
  
//   let yPos = 205;
//   reportDetails.forEach(detail => {
//     doc.fontSize(11)
//        .fillColor('#155724')
//        .font('Helvetica-Bold')
//        .text(detail.label, 80, yPos);
    
//     doc.font('Helvetica')
//        .text(detail.value, 180, yPos);
//     yPos += 18;
//   });

//   if (manualReport.contents && manualReport.contents.length > 0) {
//     manualReport.contents.forEach((content, contentIndex) => {
//       doc.addPage();
//       addPageHeader(doc);
      
//       // Page title with styling
//       doc.roundedRect(60, 120, 480, 40, 5)
//          .fillAndStroke('#e3f2fd', '#1976d2');
      
//       doc.fontSize(16)
//          .fillColor('#1976d2')
//          .font('Helvetica-Bold')
//          .text(`Page Analysis: ${content.pageUrl || 'N/A'}`, 80, 135);

//       if (content.formData && content.formData.length > 0) {
//         let currentY = 180;
        
//         content.formData.forEach((item, itemIndex) => {
//           // Check if we need a new page
//           if (currentY > 650) {
//             doc.addPage();
//             addPageHeader(doc);
//             currentY = 120;
//           }
          
//           // Category header
//           doc.roundedRect(60, currentY, 480, 30, 5)
//              .fillAndStroke('#fff3cd', '#856404');
          
//           doc.fontSize(14)
//              .fillColor('#856404')
//              .font('Helvetica-Bold')
//              .text(`${itemIndex + 1}. ${item.category || 'N/A'}`, 80, currentY + 10);
          
//           currentY += 40;
          
//           // Description
//           doc.fontSize(12)
//              .fillColor('#333333')
//              .font('Helvetica-Bold')
//              .text('Description:', 80, currentY);
          
//           doc.font('Helvetica')
//              .text(item.description || 'N/A', 80, currentY + 15, { 
//                width: 460,
//                lineGap: 3
//              });
          
//           currentY += 50;
          
//           // User Impact
//           doc.font('Helvetica-Bold')
//              .text('User Impact:', 80, currentY);
          
//           doc.font('Helvetica')
//              .text(item.user_impact || 'N/A', 80, currentY + 15, { 
//                width: 460,
//                lineGap: 3
//              });
          
//           currentY += 45;

//           // Conditions table
//           if (item.conditions && item.conditions.length > 0) {
//             doc.font('Helvetica-Bold')
//                .text('Conditions & Remediation:', 80, currentY);
            
//             currentY += 25;
            
//             // Table header
//             doc.roundedRect(80, currentY, 460, 25, 3)
//                .fillAndStroke('#6c757d', '#6c757d');
            
//             doc.fontSize(10)
//                .fillColor('white')
//                .font('Helvetica-Bold')
//                .text('Condition', 90, currentY + 8)
//                .text('Remediation', 240, currentY + 8)
//                .text('Status', 450, currentY + 8);
            
//             currentY += 25;
            
//             item.conditions.forEach((condition, condIndex) => {
//               const rowColor = condIndex % 2 === 0 ? '#f8f9fa' : 'white';
              
//               doc.roundedRect(80, currentY, 460, 30, 3)
//                  .fillAndStroke(rowColor, '#dee2e6');
              
//               doc.fontSize(9)
//                  .fillColor('#333333')
//                  .font('Helvetica')
//                  .text(condition.condition || 'N/A', 90, currentY + 5, { width: 140, height: 20 })
//                  .text(condition.remidiation || 'N/A', 240, currentY + 5, { width: 200, height: 20 });
              
//               // Status with color coding
//               const statusColor = condition.status === 'Pass' ? '#28a745' : 
//                                  condition.status === 'Fail' ? '#dc3545' : '#ffc107';
              
//               doc.fillColor(statusColor)
//                  .font('Helvetica-Bold')
//                  .text(condition.status || 'N/A', 450, currentY + 10);
              
//               currentY += 30;
//             });
//           }
          
//           currentY += 20; // Space between items
//         });
//       }
//     });
//   }
  
//   // Summary statistics page
//   addManualSummaryPage(doc, manualReport);
// }

// function addManualSummaryPage(doc, manualReport) {
//   doc.addPage();
//   addPageHeader(doc);
  
//   doc.fontSize(20)
//      .fillColor('#28a745')
//      .font('Helvetica-Bold')
//      .text('Manual Assessment Summary', 60, 120);
  
//   // Calculate statistics
//   let totalConditions = 0;
//   let passedConditions = 0;
//   let failedConditions = 0;
//   let totalPages = manualReport.contents ? manualReport.contents.length : 0;
  
//   if (manualReport.contents) {
//     manualReport.contents.forEach(content => {
//       if (content.formData) {
//         content.formData.forEach(item => {
//           if (item.conditions) {
//             item.conditions.forEach(condition => {
//               totalConditions++;
//               if (condition.status === 'Pass') passedConditions++;
//               if (condition.status === 'Fail') failedConditions++;
//             });
//           }
//         });
//       }
//     });
//   }
  
//   // Statistics boxes
//   const stats = [
//     { label: 'Pages Tested', value: totalPages, color: '#1976d2' },
//     { label: 'Total Conditions', value: totalConditions, color: '#6c757d' },
//     { label: 'Passed', value: passedConditions, color: '#28a745' },
//     { label: 'Failed', value: failedConditions, color: '#dc3545' }
//   ];
  
//   let xPos = 60;
//   stats.forEach(stat => {
//     doc.roundedRect(xPos, 180, 110, 80, 5)
//        .fillAndStroke('#f8f9fa', stat.color);
    
//     doc.fontSize(24)
//        .fillColor(stat.color)
//        .font('Helvetica-Bold')
//        .text(stat.value.toString(), xPos + 55, 200, { align: 'center', width: 110 });
    
//     doc.fontSize(12)
//        .fillColor('#333333')
//        .font('Helvetica')
//        .text(stat.label, xPos + 55, 235, { align: 'center', width: 110 });
    
//     xPos += 120;
//   });
  
//   // Compliance percentage
//   const complianceRate = totalConditions > 0 ? Math.round((passedConditions / totalConditions) * 100) : 0;
  
//   doc.roundedRect(60, 300, 480, 60, 5)
//      .fillAndStroke('#e8f5e8', '#28a745');
  
//   doc.fontSize(18)
//      .fillColor('#28a745')
//      .font('Helvetica-Bold')
//      .text(`Overall Manual Compliance Rate: ${complianceRate}%`, 80, 325);
// }

// // exports.generateManualAccessibilityReportPDF = async (txn_id) => {
// //   try {
// //     const manualReport = await getManualReportService(txn_id);

// //     if (!manualReport) {
// //       throw new AppError("Report data not found", 404);
// //     }

// //     // Create PDF document
// //     const doc = new PDFDocument({ margin: 50, size: 'A4' });
// //     const buffers = [];

// //     doc.on('data', buffers.push.bind(buffers));
    
// //     return new Promise((resolve, reject) => {
// //       doc.on('end', () => {
// //         const pdfBuffer = Buffer.concat(buffers);
// //         resolve({
// //           filename: `manual-accessibility-report-${txn_id}.pdf`,
// //           buffer: pdfBuffer,
// //         });
// //       });

// //       doc.on('error', reject);

// //       try {
// //         // Add manual report content
// //         addManualReportContent(doc, manualReport);
// //         doc.end();
// //       } catch (error) {
// //         reject(error);
// //       }
// //     });
// //   } catch (err) {
// //     console.error("Manual PDF generation failed:", err);
// //     throw new AppError("Failed to generate manual PDF report", 500);
// //   }
// // };

// // exports.generateDeepAccessibilityReportPDF = async (assessment_id, txn_id) => {
// //   try {
// //     const summaryRows = await getSummaryDetailReportService(assessment_id);
// //     const categoryRows = await getCategoryDataService(assessment_id);
// //     const manualReport = await getManualReportService(txn_id);

// //     if (!summaryRows || !categoryRows || !manualReport) {
// //       throw new AppError("Report data not found", 404);
// //     }

// //     const accessibilityOnly = categoryRows.contents.filter(
// //       item => item.category_report_name === "Accessibility"
// //     );

// //     const auditScore = summaryRows.accessibility_score || 0;
// //     const text = auditScore >= 95 
// //       ? "Your product is ADA Compliant" 
// //       : "Score above 95% ensures ADA compliant";

// //     const base64WithPrefix = generateScoreCardImage(auditScore, text, 600, 350);
// //     const base64 = base64WithPrefix.split(",")[1];
// //     const scoreImageBuffer = Buffer.from(base64, 'base64');

// //     // Create PDF document combining both reports
// //     const doc = new PDFDocument({ margin: 50, size: 'A4' });
// //     const buffers = [];

// //     doc.on('data', buffers.push.bind(buffers));
    
// //     return new Promise((resolve, reject) => {
// //       doc.on('end', () => {
// //         const pdfBuffer = Buffer.concat(buffers);
// //         resolve({
// //           filename: `deep-accessibility-report-${assessment_id}.pdf`,
// //           buffer: pdfBuffer,
// //         });
// //       });

// //       doc.on('error', reject);

// //       try {
// //         // Add combined report content
// //         doc.fontSize(20).text('Deep Accessibility Assessment Report', 50, 50);
// //         doc.moveDown();
        
// //         // Add automated report sections
// //         addPDFHeader(doc, categoryRows.accessibilityInfo);
// //         addProjectDetails(doc, categoryRows.accessibilityInfo);
// //         addExecutiveSummary(doc, categoryRows.accessibilityInfo);
// //         addAccessibilityStandards(doc, categoryRows.accessibilityInfo);
        
// //         // Add score image
// //         doc.addPage();
// //         doc.fontSize(18).text('Assessment Results', 50, 50);
// //         doc.moveDown();
        
// //         try {
// //           doc.image(scoreImageBuffer, 50, doc.y, { width: 500 });
// //           doc.moveDown(15);
// //         } catch (imageError) {
// //           console.error('Error adding score image:', imageError);
// //           doc.text(`Audit Score: ${auditScore}%`, { align: 'center' });
// //           doc.moveDown();
// //         }
        
// //         // Add summary data
// //         addSummaryData(doc, summaryRows.contents);
        
// //         // Add detailed accessibility issues
// //         addDetailedIssues(doc, accessibilityOnly);
        
// //         // Add manual report sections
// //         doc.addPage();
// //         doc.fontSize(18).text('Manual Assessment Results', 50, 50);
// //         doc.moveDown();
// //         addManualReportContent(doc, manualReport, false); // false = don't add title again
        
// //         // Add footer sections
// //         addFooterSections(doc, categoryRows.accessibilityInfo);
        
// //         doc.end();
// //       } catch (error) {
// //         reject(error);
// //       }
// //     });
// //   } catch (err) {
// //     console.error("Deep PDF generation failed:", err);
// //     throw new AppError("Failed to generate deep PDF report", 500);
// //   }
// // };

// // ================================
// // PDF HELPER FUNCTIONS
// // ================================

// // Helper function to add PDF header
// function addPDFHeader(doc, accessibilityInfo) {
//   doc.fontSize(24).fillColor('#1f4e79').text('ACCESSIBILITY EVALUATION REPORT', 50, 50);
//   doc.fontSize(14).fillColor('black').text(`Research and Improvements for ${accessibilityInfo?.web_url || 'N/A'}`, 50, 90);
//   doc.moveDown(3);
// }

// // Helper function to add project details
// function addProjectDetails(doc, accessibilityInfo) {
//   doc.addPage();
//   doc.fontSize(18).text('Project Details', 50, 50);
//   doc.moveDown();
  
//   const projectDetails = [
//     { label: 'Client:', value: accessibilityInfo?.org_name || "Unknown Org" },
//     { label: 'Project:', value: accessibilityInfo?.web_url || "N/A" },
//     { label: 'Test Site #:', value: '1' },
//     { label: 'Project Manager:', value: 'NA' },
//     { label: 'Accessibility Tester:', value: 'NA' },
//     { label: 'Testing Device:', value: 'System' },
//     { label: 'Test Environment:', value: 'NA' },
//     { label: 'WCAG Standard:', value: accessibilityInfo?.level || 'WCAG 2.1 AA' },
//     { label: 'Testing Start Date:', value: formattedDate(new Date(accessibilityInfo?.assessment_timestamp), "MM-dd-yyyy") || "" },
//     { label: 'Report Issued Date:', value: formattedDate(new Date(accessibilityInfo?.assessment_timestamp), "MM-dd-yyyy") || "" }
//   ];

//   projectDetails.forEach(detail => {
//     doc.fontSize(12).text(`${detail.label} ${detail.value}`, 50, doc.y);
//     doc.moveDown(0.5);
//   });
// }

// // Helper function to add executive summary
// function addExecutiveSummary(doc, accessibilityInfo) {
//   doc.addPage();
//   doc.fontSize(18).text('Executive Summary', 50, 50);
//   doc.moveDown();
  
//   const summaryText = `The objective of the remediation report was to give overview of ${accessibilityInfo?.guideline || 'WCAG'} level ${accessibilityInfo?.level || 'AA'} compliance of ${accessibilityInfo?.web_url || 'the website'}.

// The website failed a number of Section 508 and ${accessibilityInfo?.guideline || 'WCAG'} level ${accessibilityInfo?.level || 'AA'} standards that will adversely impact the usability of the website by persons with disabilities.

// The Website contains serious accessibility violations, which may prevent disabled users from accessing website content. The most important problems include: alt text issues, keyboard accessibility problems, ARIA role requirements, and document title concerns.`;

//   doc.fontSize(12).text(summaryText, 50, doc.y, { align: 'justify' });
// }

// // Helper function to add accessibility standards
// function addAccessibilityStandards(doc, accessibilityInfo) {
//   doc.addPage();
//   doc.fontSize(18).text('Accessibility Evaluation Standards', 50, 50);
//   doc.moveDown();
  
//   const standardsText = `Web Content Accessibility Guidelines (WCAG) are developed through the W3C process in cooperation with individuals and organizations around the world, with a goal of providing a single shared standard for web content accessibility that meets the needs of individuals, organizations, and governments internationally.

// ${accessibilityInfo?.guideline || 'WCAG'} is divided into three conformance levels (A, AA, AAA) because the success criteria are organised based on the impact they have on design or visual presentation of the pages.

// • Level A - Success criteria are those which will have a high impact on a broad array of user populations.
// • Level AA - Success criteria will also have a high impact for users, sometimes affecting specific user populations.`;

//   doc.fontSize(12).text(standardsText, 50, doc.y, { align: 'justify' });
// }

// // Helper function to add summary data
// function addSummaryData(doc, summaryContents) {
//   if (!summaryContents || summaryContents.length === 0) return;
  
//   doc.addPage();
//   doc.fontSize(16).text('Summary', 50, 50);
//   doc.moveDown();
  
//   // Create table headers
//   doc.fontSize(12).text('Category', 50, doc.y);
//   doc.text('Pages', 200, doc.y);
//   doc.text('Benchmark', 350, doc.y);
//   doc.moveDown();
  
//   // Add a line under headers
//   doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
//   doc.moveDown(0.5);
  
//   summaryContents.forEach(item => {
//     doc.text(item.category || '', 50, doc.y);
//     doc.text(item.pages || '', 200, doc.y);
//     doc.text(item.benchmark || '', 350, doc.y);
//     doc.moveDown(0.5);
//   });
// }

// // Helper function to add detailed issues
// function addDetailedIssues(doc, accessibilityIssues) {
//   if (!accessibilityIssues || accessibilityIssues.length === 0) return;
  
//   doc.addPage();
//   doc.fontSize(16).text('Detail Accessibility Issues', 50, 50);
//   doc.moveDown();
  
//   doc.fontSize(10).text('This section shows accessibility issues, indicating problems for older users, people with disabilities or accessibility needs.', 50, doc.y);
//   doc.moveDown(2);
  
//   accessibilityIssues.forEach((issue, index) => {
//     // Check if we need a new page
//     if (doc.y > 650) {
//       doc.addPage();
//     }
    
//     doc.fontSize(12).fillColor('#1f4e79').text(`Issue ${index + 1}: ${issue.criteria || 'N/A'}`, 50, doc.y);
//     doc.fontSize(10).fillColor('black');
//     doc.moveDown(0.5);
    
//     doc.text(`Description: ${issue.issue_description || 'N/A'}`, 60, doc.y);
//     doc.moveDown(0.5);
    
//     doc.text(`Level: ${issue.level || 'A'}`, 60, doc.y);
//     doc.moveDown(0.5);
    
//     doc.text(`Guideline: ${issue.guideline || 'N/A'}`, 60, doc.y);
//     doc.moveDown(0.5);
    
//     if (issue.category_details && issue.category_details.length > 0) {
//       doc.text('Affected Pages:', 60, doc.y);
//       doc.moveDown(0.3);
      
//       issue.category_details.forEach(detail => {
//         doc.text(`• ${detail.page_url || 'N/A'}`, 80, doc.y);
//         doc.moveDown(0.3);
        
//         if (detail.page_details && detail.page_details.length > 0) {
//           detail.page_details.forEach(pageDetail => {
//             doc.text(`  - ${pageDetail.description || 'N/A'} (Lines: ${pageDetail.line_numbers || 'N/A'})`, 100, doc.y);
//             doc.moveDown(0.2);
//           });
//         }
//       });
//     }
    
//     doc.moveDown(1);
//   });
// }

// // Helper function for manual report content
// function addManualReportContent(doc, manualReport, addTitle = true) {
//   if (addTitle) {
//     doc.fontSize(20).text('Manual Accessibility Assessment Report', 50, 50);
//     doc.moveDown(2);
//   }
  
//   doc.fontSize(14).text(`Website: ${manualReport.reportInfo?.web_url || 'N/A'}`, 50, doc.y);
//   doc.text(`Organization: ${manualReport.reportInfo?.org_name || 'Unknown Org'}`, 50, doc.y);
//   doc.text(`Start Date: ${formattedDate(new Date(manualReport.reportInfo?.start_date), "MM-dd-yyyy") || ""}`, 50, doc.y);
//   doc.text(`End Date: ${formattedDate(new Date(manualReport.reportInfo?.end_date), "MM-dd-yyyy") || ""}`, 50, doc.y);
//   doc.moveDown(2);

//   if (manualReport.contents && manualReport.contents.length > 0) {
//     manualReport.contents.forEach((content, contentIndex) => {
//       doc.addPage();
//       doc.fontSize(16).text(`Page: ${content.pageUrl || 'N/A'}`, 50, 50);
//       doc.moveDown();

//       if (content.formData && content.formData.length > 0) {
//         content.formData.forEach((item, itemIndex) => {
//           doc.fontSize(14).text(`Category: ${item.category || 'N/A'}`, 50, doc.y);
//           doc.moveDown(0.5);
          
//           doc.fontSize(12).text(`Description: ${item.description || 'N/A'}`, 60, doc.y);
//           doc.moveDown(0.5);
          
//           doc.text(`User Impact: ${item.user_impact || 'N/A'}`, 60, doc.y);
//           doc.moveDown(0.5);

//           if (item.conditions && item.conditions.length > 0) {
//             doc.text('Conditions:', 60, doc.y);
//             doc.moveDown(0.3);
            
//             item.conditions.forEach(condition => {
//               doc.text(`• Condition: ${condition.condition || 'N/A'}`, 80, doc.y);
//               doc.text(`  Remediation: ${condition.remidiation || 'N/A'}`, 80, doc.y);
//               doc.text(`  Status: ${condition.status || 'N/A'}`, 80, doc.y);
//               doc.moveDown(0.5);
//             });
//           }
//           doc.moveDown(1);
//         });
//       }
//     });
//   }
// }

// // Helper function to add footer sections
// function addFooterSections(doc, accessibilityInfo) {
//   doc.addPage();
//   doc.fontSize(16).text('A Note on Third Party Content', 50, 50);
//   doc.moveDown();
  
//   const thirdPartyText = `Please be aware that several third-party elements, such as iframes, forms, videos, or embedded content, may not fully comply with accessibility standards. This could result in partial accessibility across your website, as we are unable to modify or guarantee the accessibility of external content.

// We strongly recommend integrating all critical elements directly within the site to ensure greater control over accessibility.`;

//   doc.fontSize(12).text(thirdPartyText, 50, doc.y, { align: 'justify' });
  
//   doc.addPage();
//   doc.fontSize(16).text("What's Next?", 50, 50);
//   doc.moveDown();
  
//   const nextStepsText = `We recommend that you engage us for a comprehensive, in-depth accessibility assessment of your website and web application. This detailed assessment will go beyond automated scans, providing a thorough manual review of accessibility issues.

// Our assessment process includes:
// • Manual testing for ${accessibilityInfo?.guideline || 'WCAG'} compliance
// • Deep assessment of interactive elements and metadata
// • PDF and Word document accessibility review
// • Tailored remediation solutions

// Step 2 – Deep Assessment
// In-Depth Accessibility Assessment

// Our assessment process is meticulous and designed to uncover both surface-level and deeper accessibility issues that automated tools might miss. We will:

// • Manually Test your web application and website for compliance with ${accessibilityInfo?.guideline || 'WCAG'} standards and ADA guidelines.
// • Conduct a Deep Assessment that examines not only the structure and content of your documents but also interactive elements, metadata, and visual content.
// • Assess PDFs and Word Documents to ensure that all downloadable content is fully accessible and compliant with accessibility standards.

// This Process will identify Common Accessibility Issues in PDFs and Word Documents:
// • Missing or Incorrect Document Structure
// • Inaccessible Form Fields
// • Images Without Alt Text
// • Lack of Proper Color Contrast
// • Improper Use of Tables
// • Missing or Incorrect Language Declaration
// • Untagged PDFs
// • Broken Links or Missing Bookmarks

// How the In-Depth Assessment Will Help You:

// Enhance User Experience: Ensuring that your website and documents are accessible to all users, including those with disabilities, creates a more inclusive experience and makes your content easier to navigate.

// Increase Compliance with Legal Standards: A thorough review will help your website and documents meet ${accessibilityInfo?.guideline || 'WCAG'} and ADA compliance, reducing the risk of legal issues related to accessibility.

// Boost Brand Reputation: By making your digital content accessible, you demonstrate a commitment to inclusivity, which enhances your brand's reputation as being socially responsible.

// Expand Your Audience: Accessible websites and documents allow you to reach a wider audience, including users with disabilities who rely on assistive technologies.

// Receive Tailored Solutions: For each issue we identify, we will provide detailed remediation examples, showing your team exactly how to fix the problem.

// Step 3 – Web Accessibility Remediation

// Following the completion of the initial assessment and remediation plan, our team will proceed with the following steps:

// 1. Implement Remediation: Our technical experts will meticulously execute the remediation plan, addressing identified accessibility issues and ensuring compliance with WCAG standards.

// 2. Verify Remediation: Once the remediation is complete, we will conduct a thorough verification process to confirm that all issues have been successfully resolved.

// 3. Update Documentation: We will update the documentation to reflect the changes made during the remediation process.

// 4. Deliverables: Upon completion of the remediation and verification, we will provide:
//    • Documentation of Resolved Issues: A detailed report outlining the specific accessibility issues that were addressed and the corrective actions taken.
//    • Confirmation of ADA Compliance: A statement confirming that the website and documents now meet the requirements of the Americans with Disabilities Act (ADA).
//    • Updated Accessibility Report: A comprehensive accessibility report that provides an overview of the remediation process and current state of accessibility.`;

//   doc.fontSize(12).text(nextStepsText, 50, doc.y, { align: 'justify' });
  
//   // Add final page with contact information
//   doc.addPage();
//   doc.fontSize(18).text('Thank You!', 50, 50);
//   doc.moveDown();
  
//   doc.fontSize(16).text('Contact Information', 50, doc.y);
//   doc.moveDown();
  
//   doc.fontSize(12).text('Website: https://agreeya.com/', 50, doc.y);
//   doc.text('Email: sales_americas@agreeya.com', 50, doc.y);
//   doc.text('Phone: +1 (916) 294-0075', 50, doc.y);
//   doc.moveDown();
  
//   doc.fontSize(14).text('Reference', 50, doc.y);
//   doc.moveDown(0.5);
//   doc.fontSize(12).text('WCAG2.2: https://www.w3.org/TR/WCAG22/', 50, doc.y);
// }














