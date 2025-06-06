const fs = require("fs");
const path = require("path");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const ImageModule = require("docxtemplater-image-module-free");
const { generateScoreCardImage, formattedDate, replaceLinks } = require("../utils/helper");
const { getSummaryDetailReportService } = require("./dashboardService");
const { getCategoryDataService } = require("./reportsService");
const {getManualReportService} = require("../services/manualServce")
const { AppError } = require("../middlewares/errorHandler");

exports.generateAccessibilityReport = async (assessment_id) => {
  try {
    // Fetch data from services
    const summaryRows = await getSummaryDetailReportService(assessment_id);
    const categoryRows = await getCategoryDataService(assessment_id);

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
      issues: categoryRows?.contents.map((issue) => ({
        criteria: issue.criteria || "",
        description: issue.issue_description || "",
        remediation: issue.remediation || "",
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
      audit_score: base64,
    };

    // Load and populate DOCX template
    const templatePath = path.resolve(
      __dirname,
      "../templates/templatedocx2.docx"
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
    // Then, prepare data for link replacement
      // We need to transform our data to match the expected format for replaceLinks
      const linkReplacementData = {
        linkObj: reportData.linkObj,
        issues: reportData.issues.map(issue => ({
          ...issue,
          pages: issue.pages.map(page => ({
            ...page,
            link: page.linkObj // Use the linkObj we set above
          }))
        }))
      };

      // Now replace {link} placeholders with actual hyperlinks
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
    // Fetch data from services
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
    
    // Load and populate DOCX template
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

    const doc = new Docxtemplater(zip, {
      modules: [imageModule],
    });

    doc.render(manualData);
    // Then, prepare data for link replacement
      // We need to transform our data to match the expected format for replaceLinks
      const linkReplacementData = {
        linkObj: manualData.linkObj,
      };

      // Now replace {link} placeholders with actual hyperlinks
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
    // Fetch data from services
    const summaryRows = await getSummaryDetailReportService(assessment_id);
    const categoryRows = await getCategoryDataService(assessment_id);
    const manualReport = await getManualReportService(txn_id);

    if (!summaryRows || !categoryRows || !manualReport) {
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
      end_date: formattedDate(new Date(manualReport.reportInfo.end_date), "MM-dd-yyyy") || "",
      issues: categoryRows?.contents.map((issue) => ({
        criteria: issue.criteria || "",
        description: issue.issue_description || "",
        remediation: issue.remediation || "",
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

    // Load and populate DOCX template
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

    const doc = new Docxtemplater(zip, {
      modules: [imageModule],
    });

    doc.render(reportData);
    // Then, prepare data for link replacement
      // We need to transform our data to match the expected format for replaceLinks
      const linkReplacementData = {
        linkObj: reportData.linkObj,
        issues: reportData.issues.map(issue => ({
          ...issue,
          pages: issue.pages.map(page => ({
            ...page,
            link: page.linkObj // Use the linkObj we set above
          }))
        }))
      };

      // Now replace {link} placeholders with actual hyperlinks
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