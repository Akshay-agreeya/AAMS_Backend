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

// ------------------ UTILITY: EMBED LOCAL IMAGE AS BASE64 ------------------
function getBase64Image(filePath) {
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).substring(1); // jpg, png, etc.
    const data = fs.readFileSync(filePath, "base64");
    return `data:image/${ext};base64,${data}`;
  }
  console.warn("Image not found:", filePath);
  return null;
}

// ------------------ PDF GENERATION (PUPPETEER) ------------------
const generatePDFFromHTML = async (htmlTemplate, data) => {
  try {
    console.log("Starting HTML to PDF conversion with Puppeteer...");

    // Compile with Handlebars
    const template = handlebars.compile(htmlTemplate);
    const html = template(data);

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

  // 👇 Load static images
  const logoPath = path.resolve(
    __dirname,
    "../templates/liteAssessment_templatehtml_files/image002.jpg"
  );
  const diagramPath = path.resolve(
    __dirname,
    "../templates/liteAssessment_templatehtml_files/image003.png"
  );

  
  const remediationProcess = getBase64Image(
    path.resolve(__dirname, "../templates/liteAssessment_templatehtml_files/image004.png")
  );


  // Inside mapDataForTemplate, just below remediation_process
const footerBackground = getBase64Image(
  path.resolve(__dirname, "../templates/liteAssessment_templatehtml_files/image005.png")
);
const websiteIcon = getBase64Image(
  path.resolve(__dirname, "../templates/liteAssessment_templatehtml_files/image007.png")
);
const websiteText = getBase64Image(
  path.resolve(__dirname, "../templates/liteAssessment_templatehtml_files/image008.png")
);
const emailIcon = getBase64Image(
  path.resolve(__dirname, "../templates/liteAssessment_templatehtml_files/image009.png")
);
const emailText = getBase64Image(
  path.resolve(__dirname, "../templates/liteAssessment_templatehtml_files/image010.png")
);
const phoneIcon = getBase64Image(
  path.resolve(__dirname, "../templates/liteAssessment_templatehtml_files/image011.png")
);
const phoneText = getBase64Image(
  path.resolve(__dirname, "../templates/liteAssessment_templatehtml_files/image012.png")
);


const logoAgreeya = getBase64Image(
  path.resolve(__dirname, "../templates/liteAssessment_templatehtml_files/image001.png")
);



  const sortsiteLogo = getBase64Image(logoPath);
  const deepDiagram = getBase64Image(diagramPath);

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

    // 👇 Inject static images
    sortsite_logo: sortsiteLogo,
    deep_diagram: deepDiagram,
    remediation_process: remediationProcess,

    
  // 👇 Add footer placeholders
  footer_background: footerBackground,
  website_icon: websiteIcon,
  website_text: websiteText,
  email_icon: emailIcon,
  email_text: emailText,
  phone_icon: phoneIcon,
  phone_text: phoneText,
  logo_image:logoAgreeya,
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

    // 👇 Embed static images
    const logoPath = path.resolve(
      __dirname,
      "../templates/liteAssessment_templatehtml_files/image002.jpg"
    );
    const diagramPath = path.resolve(
      __dirname,
      "../templates/liteAssessment_templatehtml_files/image003.png"
    );
    const sortsiteLogo = getBase64Image(logoPath);
    const deepDiagram = getBase64Image(diagramPath);

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

      // 👇 Inject images
      sortsite_logo: sortsiteLogo,
      deep_diagram: deepDiagram,

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

    // 👇 Embed static images
    const logoPath = path.resolve(
      __dirname,
      "../templates/liteAssessment_templatehtml_files/image002.jpg"
    );
    const diagramPath = path.resolve(
      __dirname,
      "../templates/liteAssessment_templatehtml_files/image003.png"
    );
    reportData.sortsite_logo = getBase64Image(logoPath);
    reportData.deep_diagram = getBase64Image(diagramPath);

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
