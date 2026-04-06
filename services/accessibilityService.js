const { sql, getConnectionPool } = require("../config/db");
const { ERROR_MESSAGES, STATUS_CODES } = require("../utils/errorCodes");
const { AppError } = require("../middlewares/errorHandler");
const XLSX = require("xlsx");

const imageService = require('./imageService');
const { extractImagesFromExcel } = require('../helpers/excel-helper');
const fs = require('fs');

/**
 * Get Complete Accessibility Report
 * Returns all data from the 4 Excel tabs for a given assessment
 */
exports.getAccessibilityReportService = async (assessment_id) => {
    try {
        const pool = await getConnectionPool();

        // ========================================
        // TAB 1: ACCESSIBILITY OVERVIEW
        // ========================================

        // Get Assessment Basic Info with Conformance Score
        const assessmentResult = await pool.request()
            .input('assessment_id', sql.Int, assessment_id)
            .query(`
                SELECT 
                    a.assessment_id,
                    a.service_id,
                    a.conformance_score,
                    a.status,
                    a.assessment_timestamp
                -- FROM Assessments_DEV a
                FROM Assessments_v2 a

                WHERE a.assessment_id = @assessment_id
            `);

        if (!assessmentResult.recordset.length) {
            throw new AppError(
                ERROR_MESSAGES.ASSESSMENT_NOT_FOUND || 'Assessment not found',
                STATUS_CODES.NOT_FOUND
            );
        }

        const metadataResult = await pool.request()
            .input('assessment_id', sql.Int, assessment_id)
            .query(`
                SELECT 
                    report_meta_id,
                    prepared_for,
                    report_date
                -- FROM Assessment_Report_Metadata_DEV
                FROM Assessment_Report_Metadata

                WHERE assessment_id = @assessment_id
            `);
        
        const testingEnvResult = await pool.request()
            .input('assessment_id', sql.Int, assessment_id)
            .query(`
                SELECT 
                    category,
                    value
                -- FROM Assessment_Testing_Environment_DEV
                FROM Assessment_Testing_Environment
                WHERE assessment_id = @assessment_id
                ORDER BY env_id
            `);

        // Format Testing Environment like Excel
        const testingEnvironment = {
            automated_tools: [],
            operating_system: [],
            browsers: [],
            application: [],
            assistive_technologies: []
        };

        testingEnvResult.recordset.forEach(row => {
            switch (row.category) {
                case "AUTOMATED_TOOL":
                    testingEnvironment.automated_tools.push(row.value);
                    break;
                case "OPERATING_SYSTEM":
                    testingEnvironment.operating_system.push(row.value);
                    break;
                case "BROWSER":
                    testingEnvironment.browsers.push(row.value);
                    break;
                case "APPLICATION":
                    testingEnvironment.application.push(row.value);
                    break;
                case "ASSISTIVE_TECH":
                    testingEnvironment.assistive_technologies.push(row.value);
                    break;
            }
        });

        // Get WCAG Conformance Data
        const conformanceResult = await pool.request()
            .input('assessment_id', sql.Int, assessment_id)
            .query(`
                SELECT 
                    ac.conformance_id,
                    ac.wcag_id,
                    gv.guideline AS wcag_version,
                    cl.level AS conformance_level,
                    ac.passes_na,
                    ac.failed
                -- FROM Assessment_conformance_DEV ac
                FROM Assessment_conformance ac

                LEFT JOIN Guideline_version gv ON ac.wcag_id = gv.guidline_version_id
                LEFT JOIN Compliance_level cl ON ac.compliance_level_id = cl.compliance_level_id
                WHERE ac.assessment_id = @assessment_id
                ORDER BY cl.level
            `);

        // Get Severity Data
        const severityResult = await pool.request()
            .input('assessment_id', sql.Int, assessment_id)
            .query(`
                SELECT 
                    asev.severity_id,
                    s.severity_name AS severity,
                    asev.no_of_issues,
                    asev.defect_score
                -- FROM Assessment_severity_DEV asev
                FROM Assessment_severity asev

                // LEFT JOIN Severity_DEV s ON asev.severity = s.severity_id
                                LEFT JOIN Severity s ON asev.severity = s.severity_id

                WHERE asev.assessment_id = @assessment_id
                ORDER BY 
                    CASE s.severity_name
                        WHEN 'Blocker' THEN 1
                        WHEN 'Critical' THEN 2
                        WHEN 'Major' THEN 3
                        WHEN 'Minor' THEN 4
                        ELSE 5
                    END
            `);

        // Get Top Accessibility Issues
        const topIssuesResult = await pool.request()
            .input('assessment_id', sql.Int, assessment_id)
            .query(`
                SELECT 
                    issue_id,
                    issue_title
                -- FROM Top_Accessibility_Issues_DEV
                           FROM Top_Accessibility_Issues
                WHERE assessment_id = @assessment_id
                ORDER BY issue_id
            `);

        // ========================================
        // TAB 2: URL DETAILS
        // ========================================
        const urlDetailsResult = await pool.request()
            .input('assessment_id', sql.Int, assessment_id)
            .query(`
                SELECT 
                    assessment_page_id,
                    assessment_id,
                    page_name,
                    page_url,
                    environments
                -- FROM Assessments_Page_DEV
                FROM Assessments_Page
                WHERE assessment_id = @assessment_id
                ORDER BY assessment_page_id
            `);

        // ========================================
        // TAB 3: DETAILED FINDINGS
        // ========================================
        const detailedFindingsResult = await pool.request()
            .input('assessment_id', sql.Int, assessment_id)
            .query(`
                SELECT 
                    cdr.category_detail_id,
                    cdr.category_id,
                    cdr.assessment_page_id,
                    ap.page_name,
                    ap.page_url,
                    cdr.issue_name,
                    cdr.actual_result,
                    cdr.instances,
                    cdr.screenshot,
                    cdr.expected_results,
                    cdr.remediation,
                    cdr.existing_code,
                    cdr.suggested_code,
                    s.severity_name AS severity,
                    cl.level AS wcag_conformance_level,
                    cdr.wcag_success_criteria,
                    cdr.section_508,
                    cdr.environments_applicable,
                    cdr.template_issue,
                    cdr.template_name,
                    cdr.status
                -- FROM Category_Detail_Report_DEV cdr
                                FROM Category_Detail_Report_v2 cdr

                // INNER JOIN Assessments_Page_DEV ap ON cdr.assessment_page_id = ap.assessment_page_id
                INNER JOIN Assessments_Page ap ON cdr.assessment_page_id = ap.assessment_page_id

                LEFT JOIN Category_Report cr ON cdr.category_id = cr.category_id
                // LEFT JOIN Severity_DEV s ON cdr.severity = s.severity_id
                                LEFT JOIN Severity s ON cdr.severity = s.severity_id

                LEFT JOIN Compliance_level cl ON cdr.wcag_conformance_level = cl.compliance_level_id
                WHERE ap.assessment_id = @assessment_id
                ORDER BY 
                    CASE s.severity_name
                        WHEN 'Blocker' THEN 1
                        WHEN 'Critical' THEN 2
                        WHEN 'Major' THEN 3
                        WHEN 'Minor' THEN 4
                        ELSE 5
                    END,
                    cdr.category_detail_id
            `);

        // ========================================
        // TAB 4: WCAG GUIDELINES (Static Reference Data)
        // ========================================
        const wcagGuidelinesResult = await pool.request()
            .query(`
                SELECT TOP 100
                    w.wcag_id,
                    w.guideline_version_id,
                    gv.guideline AS wcag_version,
                    w.compliance_level_id,
                    cl.level AS conformance_level,
                    w.guideline AS wcag_success_criteria,
                    w.description
                -- FROM WCAG_DEV w
                                FROM WCAG w

                LEFT JOIN Guideline_version gv ON w.guideline_version_id = gv.guidline_version_id
                LEFT JOIN Compliance_level cl ON w.compliance_level_id = cl.compliance_level_id
                ORDER BY w.guideline
            `);

        // ========================================
        // RETURN COMBINED DATA
        // ========================================
        return {
            assessment_id: parseInt(assessment_id),

            // Tab 1: Accessibility Overview
            overview: {
                assessment_info: assessmentResult.recordset[0],
                testing_environment: testingEnvironment,
                metadata: metadataResult.recordset[0] || null,
                wcag_conformance: conformanceResult.recordset,
                severity_breakdown: severityResult.recordset,
                top_issues: topIssuesResult.recordset
            },

            // Tab 2: URL Details
            url_details: urlDetailsResult.recordset,

            // Tab 3: Detailed Findings
            detailed_findings: detailedFindingsResult.recordset,

            // Tab 4: WCAG Guidelines Reference
            wcag_guidelines: wcagGuidelinesResult.recordset
        };

    } catch (err) {
        console.error('Error in getAccessibilityReportService:', err);
        throw new AppError(
            err.message || 'Error fetching accessibility report',
            err.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        );
    }
};


/**
 * Upload and Process Accessibility Excel File
 * Extracts data from all 4 tabs and saves to database
 */


exports.uploadAccessibilityExcelService = async (filePath, org_id) => {
    const pool = await getConnectionPool();
    const transaction = pool.transaction();

    try {
        await transaction.begin();

        // ✅ Check if a service exists for this org, if not create one
        let service_id;
        
        const existingServiceResult = await transaction.request()
            .input('org_id', sql.UniqueIdentifier, org_id)
            .query(`
                SELECT TOP 1 service_id 
                FROM Service 
                WHERE org_id = @org_id 
                ORDER BY service_id DESC
            `);

        if (existingServiceResult.recordset.length > 0) {
            service_id = existingServiceResult.recordset[0].service_id;
            console.log('Using existing service_id:', service_id);
        } else {
            // Create Service_Detail first
            await transaction.request()
                .input('created_by', sql.Int, 1)
                .input('creation_date', sql.DateTime2, new Date())
                .query(`
                    INSERT INTO Service_Detail (created_by, creation_date)
                    VALUES (@created_by, @creation_date)
                `);

            const serviceDetailResult = await transaction.request()
                .query(`SELECT SCOPE_IDENTITY() AS service_detail_id`);

            const service_detail_id = serviceDetailResult.recordset[0].service_detail_id;

            // Create Service
            await transaction.request()
                .input('service_detail_id', sql.Int, service_detail_id)
                .input('org_id', sql.UniqueIdentifier, org_id)
                .input('service_type_id', sql.Int, 1)
                .input('guidline_version_id', sql.Int, 1)
                .input('compliance_level_id', sql.Int, 1)
                .input('support_type_id', sql.Int, 1)
                .input('status', sql.VarChar, 'Active')
                .input('creation_date', sql.DateTime2, new Date())
                .query(`
                    INSERT INTO Service (
                        service_detail_id, org_id, service_type_id,
                        guidline_version_id, compliance_level_id,
                        support_type_id, status, creation_date
                    )
                    VALUES (
                        @service_detail_id, @org_id, @service_type_id,
                        @guidline_version_id, @compliance_level_id,
                        @support_type_id, @status, @creation_date
                    )
                `);

            const serviceIdResult = await transaction.request()
                .query(`SELECT SCOPE_IDENTITY() AS service_id`);

            service_id = serviceIdResult.recordset[0].service_id;
            console.log('Created new service_id:', service_id);
        }

        // Read the Excel workbook
        const workbook = XLSX.readFile(filePath);

        // ========================================
        // TAB 1: ACCESSIBILITY OVERVIEW
        // ========================================
        const tab1Name = workbook.SheetNames[0];
        const tab1Sheet = workbook.Sheets[tab1Name];
        const tab1Data = XLSX.utils.sheet_to_json(tab1Sheet, { header: 1, defval: "" });

        let conformanceScore = 0;
        let preparedFor = "";
        let reportDate = null;

        // Extract Metadata (Prepared for & Date)
        for (let rowIndex = 0; rowIndex < tab1Data.length; rowIndex++) {
            const row = tab1Data[rowIndex];
            for (let col = 0; col < row.length; col++) {
                const cell = String(row[col] || "").replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim().toLowerCase();

                if (cell === "prepared for:" || cell === "prepared for") {
                    let value = row[col + 1];
                    if (!value && rowIndex + 1 < tab1Data.length) {
                        value = tab1Data[rowIndex + 1][col];
                    }
                    if (value) {
                        preparedFor = String(value).trim();
                        console.log("Found prepared_for:", preparedFor);
                    }
                }

                if (cell === "date:" || cell === "date") {
                    let value = row[col + 1];
                    if (!value && rowIndex + 1 < tab1Data.length) {
                        value = tab1Data[rowIndex + 1][col];
                    }
                    if (value) {
                        if (typeof value === 'number') {
                            const excelEpoch = new Date(1899, 11, 30);
                            reportDate = new Date(excelEpoch.getTime() + value * 86400000);
                        } else {
                            const dateStr = String(value).trim();
                            reportDate = new Date(dateStr);
                            if (isNaN(reportDate.getTime())) {
                                const monthYear = dateStr.match(/([A-Za-z]+)-(\d+)/);
                                if (monthYear) {
                                    const monthMap = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
                                    const month = monthMap[monthYear[1].toLowerCase()];
                                    const year = parseInt(monthYear[2]) < 100 ? 2000 + parseInt(monthYear[2]) : parseInt(monthYear[2]);
                                    reportDate = new Date(year, month, 1);
                                }
                            }
                        }
                        console.log("Found report_date:", reportDate);
                    }
                }
            }
        }

        // Extract conformance score
        for (let rowIndex = 0; rowIndex < tab1Data.length; rowIndex++) {
            const row = tab1Data[rowIndex];
            for (let col = 0; col < row.length; col++) {
                const cell = String(row[col] || "").replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
                if (cell === "conformance score") {
                    let value = row[col + 1];
                    if (!value && rowIndex + 1 < tab1Data.length) {
                        value = tab1Data[rowIndex + 1][col];
                    }
                    if (value) {
                        const valueStr = String(value);
                        if (typeof value === 'number' && value < 1) {
                            conformanceScore = Math.round(value * 100);
                        } else if (valueStr.includes('%')) {
                            conformanceScore = parseInt(valueStr.replace("%", "").trim()) || 0;
                        } else {
                            conformanceScore = parseInt(valueStr.trim()) || 0;
                        }
                        console.log("Found conformance score:", value, "->", conformanceScore);
                    }
                    break;
                }
            }
            if (conformanceScore > 0) break;
        }

        console.log("Final conformance score:", conformanceScore);
        console.log("Final prepared_for:", preparedFor);
        console.log("Final report_date:", reportDate);

        // Create Assessment Record
        const assessmentResult = await transaction.request()
            .input("service_id", sql.Int, service_id)
            .input("conformance_score", sql.Int, conformanceScore)
            .input("status", sql.VarChar, "Completed")
            .input("assessment_timestamp", sql.DateTime2, new Date())
            .query(`
                -- INSERT INTO Assessments_DEV 
                INSERT INTO Assessments_v2
                (service_id, conformance_score, status, assessment_timestamp)
                OUTPUT INSERTED.assessment_id
                VALUES (@service_id, @conformance_score, @status, @assessment_timestamp);
            `);

        const assessmentId = assessmentResult.recordset[0].assessment_id;

        // Insert Metadata
        if (preparedFor || reportDate) {
            await transaction.request()
                .input("assessment_id", sql.Int, assessmentId)
                .input("prepared_for", sql.VarChar, preparedFor || null)
                .input("report_date", sql.Date, reportDate || null)
                .input("uploaded_at", sql.DateTime2, new Date())
                .query(`
                    -- INSERT INTO Assessment_Report_Metadata_DEV 
                    INSERT INTO Assessment_Report_Metadata 

                    (assessment_id, prepared_for, report_date, uploaded_at)
                    VALUES (@assessment_id, @prepared_for, @report_date, @uploaded_at);
                `);
            console.log("Metadata inserted successfully");
        }

        // Extract WCAG Conformance Data
        const wcagIndex = tab1Data.findIndex(r => String(r[0]).toLowerCase().includes("wcag"));
        let wcagVersion = "";
        if (wcagIndex !== -1) {
            const header = String(tab1Data[wcagIndex][0]).trim();
            wcagVersion = header.split(" ")[1];
        }

        const wcagIdResult = await pool.request()
            .input("guideline", sql.VarChar, `WCAG ${wcagVersion}`)
            .query(`SELECT guidline_version_id FROM Guideline_version WHERE guideline = @guideline`);
        const wcagId = wcagIdResult.recordset[0]?.guidline_version_id;

        const complianceLevels = await pool.request().query(`SELECT compliance_level_id, level FROM Compliance_level;`);
        const complianceMap = {};
        complianceLevels.recordset.forEach(row => {
            complianceMap[row.level.trim().toLowerCase()] = row.compliance_level_id;
        });

        const wcagRows = tab1Data.slice(wcagIndex + 1, wcagIndex + 3);
        for (let row of wcagRows) {
            const levelName = String(row[0] || "").trim();
            if (levelName.toLowerCase() === "total") continue;

            let complianceLevelId = null;
            if (levelName.toLowerCase().includes("level aa")) {
                complianceLevelId = complianceMap["level aa"] || complianceMap["aa"];
            } else if (levelName.toLowerCase().includes("level a")) {
                complianceLevelId = complianceMap["level a"] || complianceMap["a"];
            }

            if (!complianceLevelId) continue;

            await transaction.request()
                .input("assessment_id", sql.Int, assessmentId)
                .input("wcag_id", sql.Int, wcagId)
                .input("passes_na", sql.Int, parseInt(row[1]) || 0)
                .input("failed", sql.Int, parseInt(row[2]) || 0)
                .input("compliance_level_id", sql.Int, complianceLevelId)
                .query(`
                    -- INSERT INTO Assessment_conformance_DEV
                    INSERT INTO Assessment_conformance

                    (assessment_id, wcag_id, passes_na, failed, compliance_level_id)
                    VALUES (@assessment_id, @wcag_id, @passes_na, @failed, @compliance_level_id);
                `);
        }

        // Extract Severity Data
        const severityIndex = tab1Data.findIndex(r => String(r[0]).trim() === "Severity");
        if (severityIndex !== -1) {
            const severityRef = await pool.request().query(`SELECT severity_name, severity_id FROM Severity;`);

            const severityMap = {};
            severityRef.recordset.forEach(row => {
                severityMap[row.severity_name.trim().toLowerCase()] = row.severity_id;
            });

            const severityRows = tab1Data.slice(severityIndex + 1, severityIndex + 6);
            for (let row of severityRows) {
                const severityName = String(row[0] || "").trim().toLowerCase();
                if (!severityName || !severityMap[severityName]) continue;

                let defectScore = row[2];
                if (typeof defectScore === 'string') {
                    defectScore = parseFloat(defectScore.replace('%', '').trim()) || 0;
                } else if (typeof defectScore !== 'number') {
                    defectScore = 0;
                }

                await transaction.request()
                    .input("assessment_id", sql.Int, assessmentId)
                    .input("severity", sql.Int, severityMap[severityName])
                    .input("no_of_issues", sql.Int, parseInt(row[1]) || 0)
                    .input("defect_score", sql.Decimal(5, 2), defectScore)
                    .query(`
                        -- INSERT INTO Assessment_severity_DEV 
                        INSERT INTO Assessment_severity
                        (assessment_id, severity, no_of_issues, defect_score)
                        VALUES (@assessment_id, @severity, @no_of_issues, @defect_score);
                    `);
            }
        }

        // Extract Top Accessibility Issues
        const issueIndex = tab1Data.findIndex(r => {
            const cell = String(r[6] || "").replace(/\s+/g, " ").trim().toLowerCase();
            return cell.includes("sr.no") || cell.includes("sr. no");
        });

        if (issueIndex !== -1) {
            const issueRows = tab1Data.slice(issueIndex + 1, issueIndex + 6);
            for (let row of issueRows) {
                const issueTitle = String(row[7] || "").trim();
                if (!issueTitle) continue;

                await transaction.request()
                    .input("assessment_id", sql.Int, assessmentId)
                    .input("issue_title", sql.VarChar, issueTitle)
                    .query(`
                        -- INSERT INTO Top_Accessibility_Issues_DEV 
                                                INSERT INTO Top_Accessibility_Issues 

                        (assessment_id, issue_title)
                        VALUES (@assessment_id, @issue_title);
                    `);
            }
        }



        // ========================================
// Extract Testing Environment Data
// ========================================
const testingEnvHeaderIndex = tab1Data.findIndex(r => {
    // Check all columns in the row for "Automated tools", "Operating System", etc.
    return r.some(cell => {
        const cellText = String(cell || "").trim().toLowerCase();
        return cellText === "automated tools" || 
               cellText === "operating system" || 
               cellText === "browsers";
    });
});

if (testingEnvHeaderIndex !== -1) {
    console.log("Found Testing Environment header at row:", testingEnvHeaderIndex);
    
    const headerRow = tab1Data[testingEnvHeaderIndex];
    
    // Find column indices for each category
    const columnMap = {};
    headerRow.forEach((cell, colIndex) => {
        const cellText = String(cell || "").trim().toLowerCase();
        if (cellText === "automated tools") columnMap.automatedTools = colIndex;
        else if (cellText === "operating system") columnMap.operatingSystem = colIndex;
        else if (cellText === "browsers") columnMap.browsers = colIndex;
        else if (cellText === "application") columnMap.application = colIndex;
        else if (cellText === "assistive technologies") columnMap.assistiveTech = colIndex;
    });
    
    console.log("Column mapping:", columnMap);
    
    // ✅ STOP WORDS - Skip rows that contain these
    const stopWords = [
        "prepared by", "prepared for", "date:", "sr.no", "sr no",
        "agreeya", "city of", "top accessibility", "role and state"
    ];
    
    // Extract data from rows below the header
    const testingEnvDataRows = tab1Data.slice(testingEnvHeaderIndex + 1, testingEnvHeaderIndex + 15);
    
    for (let row of testingEnvDataRows) {
        if (!row || row.length === 0) continue;
        
        // ✅ Check if this row contains any stop words (in ANY column)
        const rowText = row.map(cell => String(cell || "").trim().toLowerCase()).join(" ");
        const shouldSkip = stopWords.some(stopWord => rowText.includes(stopWord));
        
        if (shouldSkip) {
            console.log("Stopping at row containing stop word:", row[0]);
            break;
        }
        
        // ✅ Skip if first column has numbers only (like "1", "45939")
        const firstCell = String(row[0] || "").trim();
        if (firstCell && /^\d+$/.test(firstCell)) {
            console.log("Skipping numeric row:", firstCell);
            continue;
        }
        
        // Extract Automated Tools
        if (columnMap.automatedTools !== undefined) {
            const value = String(row[columnMap.automatedTools] || "").trim();
            if (value && value.length > 0 && !value.toLowerCase().includes("automated")) {
                await transaction.request()
                    .input("assessment_id", sql.Int, assessmentId)
                    .input("category", sql.VarChar, "AUTOMATED_TOOL")
                    .input("value", sql.VarChar, value)
                    .query(`
                        -- INSERT INTO Assessment_Testing_Environment_DEV 
                        INSERT INTO Assessment_Testing_Environment
                        (assessment_id, category, value)
                        VALUES (@assessment_id, @category, @value);
                    `);
                console.log("Inserted Automated Tool:", value);
            }
        }
        
        // Extract Operating System
        if (columnMap.operatingSystem !== undefined) {
            const value = String(row[columnMap.operatingSystem] || "").trim();
            if (value && value.length > 0 && !value.toLowerCase().includes("operating")) {
                await transaction.request()
                    .input("assessment_id", sql.Int, assessmentId)
                    .input("category", sql.VarChar, "OPERATING_SYSTEM")
                    .input("value", sql.VarChar, value)
                    .query(`
                        -- INSERT INTO Assessment_Testing_Environment_DEV 
                        INSERT INTO Assessment_Testing_Environment
                        (assessment_id, category, value)
                        VALUES (@assessment_id, @category, @value);
                    `);
                console.log("Inserted Operating System:", value);
            }
        }
        
        // Extract Browsers
        if (columnMap.browsers !== undefined) {
            const value = String(row[columnMap.browsers] || "").trim();
            if (value && value.length > 0 && !value.toLowerCase().includes("browser")) {
                await transaction.request()
                    .input("assessment_id", sql.Int, assessmentId)
                    .input("category", sql.VarChar, "BROWSER")
                    .input("value", sql.VarChar, value)
                    .query(`
                        -- INSERT INTO Assessment_Testing_Environment_DEV 
                        INSERT INTO Assessment_Testing_Environment
                        (assessment_id, category, value)
                        VALUES (@assessment_id, @category, @value);
                    `);
                console.log("Inserted Browser:", value);
            }
        }
        
        // Extract Application
        if (columnMap.application !== undefined) {
            const value = String(row[columnMap.application] || "").trim();
            if (value && value.length > 0 && !value.toLowerCase().includes("application")) {
                await transaction.request()
                    .input("assessment_id", sql.Int, assessmentId)
                    .input("category", sql.VarChar, "APPLICATION")
                    .input("value", sql.VarChar, value)
                    .query(`
                        -- INSERT INTO Assessment_Testing_Environment_DEV 
                        INSERT INTO Assessment_Testing_Environment
                        (assessment_id, category, value)
                        VALUES (@assessment_id, @category, @value);
                    `);
                console.log("Inserted Application:", value);
            }
        }
        
        // Extract Assistive Technologies
        if (columnMap.assistiveTech !== undefined) {
            const value = String(row[columnMap.assistiveTech] || "").trim();
            if (value && value.length > 0 && !value.toLowerCase().includes("assistive")) {
                await transaction.request()
                    .input("assessment_id", sql.Int, assessmentId)
                    .input("category", sql.VarChar, "ASSISTIVE_TECH")
                    .input("value", sql.VarChar, value)
                    .query(`
                        -- INSERT INTO Assessment_Testing_Environment_DEV 
                        INSERT INTO Assessment_Testing_Environment
                        (assessment_id, category, value)
                        VALUES (@assessment_id, @category, @value);
                    `);
                console.log("Inserted Assistive Technology:", value);
            }
        }
    }
    
    console.log("Testing Environment data extraction completed");
} else {
    console.log("Testing Environment header not found in Excel");
}
        // ========================================
        // TAB 2: URL DETAILS
        // ========================================
        if (workbook.SheetNames.length > 1) {
            const tab2Name = workbook.SheetNames[1];
            const tab2Sheet = workbook.Sheets[tab2Name];
            const tab2Data = XLSX.utils.sheet_to_json(tab2Sheet, { header: 1, defval: "" });

            const urlHeaderIndex = tab2Data.findIndex(r =>
                String(r[1]).toLowerCase().includes("page") ||
                String(r[1]).toLowerCase().includes("component")
            );

            if (urlHeaderIndex !== -1) {
                const urlRows = tab2Data.slice(urlHeaderIndex + 1);
                for (let row of urlRows) {
                    const pageName = String(row[1] || "").trim();
                    const pageUrl = String(row[2] || "").trim();
                    const environments = String(row[3] || "").trim();

                    if (!pageName) continue;

                    await transaction.request()
                        .input("assessment_id", sql.Int, assessmentId)
                        .input("page_name", sql.VarChar, pageName)
                        .input("page_url", sql.VarChar, pageUrl)
                        .input("environments", sql.VarChar, environments)
                        .query(`
                            -- INSERT INTO Assessments_Page_DEV 
                                                        INSERT INTO Assessments_Page
                            (assessment_id, page_name, page_url, environments)
                            VALUES (@assessment_id, @page_name, @page_url, @environments);
                        `);
                }
            }
        }

      
        // ========================================
// ✅ TAB 3: DETAILED FINDINGS WITH IMAGE EXTRACTION
// ========================================


if (workbook.SheetNames.length > 2) {
    const tab3Name = workbook.SheetNames[2];
    const tab3Sheet = workbook.Sheets[tab3Name];
    const tab3Data = XLSX.utils.sheet_to_json(tab3Sheet, { header: 1, defval: "" });

    const findingsHeaderIndex = tab3Data.findIndex(r =>
        String(r[2]).toLowerCase().includes("issue name") ||
        String(r[1]).toLowerCase().includes("issue#")
    );

    if (findingsHeaderIndex !== -1) {

        // ✅ STEP 1: Extract images from Excel using excel-helper.js
        const extractedImages = await extractImagesFromExcel(filePath, assessmentId);
        console.log(`Found ${extractedImages.length} images in Excel`);
        console.log('Extracted images:', extractedImages);

        const findingsRows = tab3Data.slice(findingsHeaderIndex + 1);

        // Map images to rows by sheet and row number
        for (let i = 0; i < findingsRows.length; i++) {
            const row = findingsRows[i];
            const pageName = String(row[0] || "").trim();
            if (!pageName) continue;

            // Find image for this row (assuming sheet name matches tab3Name and row index + header offset matches image row)
            const excelRowNumber = i + findingsHeaderIndex + 2;
            const imageObj = extractedImages.find(img => img.sheet === tab3Name && Math.round(img.row) === excelRowNumber);
            console.log(`Row ${i}: pageName=${pageName}, excelRowNumber=${excelRowNumber}, imageObj=`, imageObj);
            let screenshotPath = imageObj ? imageObj.path : null;

            // Load severity and compliance level mappings (move outside loop if performance needed)
                        const severityRef = await pool.request().query(`SELECT severity_name, severity_id FROM Severity;`);

            const severityMap = {};
            severityRef.recordset.forEach(row => {
                severityMap[row.severity_name.trim().toLowerCase()] = row.severity_id;
            });

            const complianceRef = await pool.request().query(`SELECT level, compliance_level_id FROM Compliance_level;`);
            const complianceMap2 = {};
            complianceRef.recordset.forEach(row => {
                complianceMap2[row.level.trim().toLowerCase()] = row.compliance_level_id;
            });

            // Get assessment_page_id mapping
            const pagesResult = await transaction.request()
                .input("assessment_id", sql.Int, assessmentId)
                .query(`
                    SELECT assessment_page_id, page_name 
                    -- FROM Assessments_Page_DEV 
                    FROM Assessments_Page
                    WHERE assessment_id = @assessment_id;
                `);

            const pageMap = {};
            pagesResult.recordset.forEach(row => {
                pageMap[row.page_name.trim().toLowerCase()] = row.assessment_page_id;
            });

            const assessmentPageId = pageMap[pageName.toLowerCase()];
            if (!assessmentPageId) continue;

            const severityName = String(row[10] || "").trim().toLowerCase();
            const severityId = severityMap[severityName] || null;

            const conformanceLevelName = String(row[11] || "").trim().toLowerCase();
            const conformanceLevelId = complianceMap2[conformanceLevelName] || null;

            // ✅ STEP 5: Insert into database with screenshot path
            console.log('Inserting row with screenshotPath:', screenshotPath);
            await transaction.request()
                .input("category_id", sql.Int, 1)
                .input("assessment_page_id", sql.Int, assessmentPageId)
                .input("issue_name", sql.NVarChar, String(row[2] || "").trim())
                .input("actual_result", sql.NVarChar, String(row[3] || "").trim())
                .input("instances", sql.NVarChar, String(row[4] || "").trim())
                .input("screenshot", sql.NVarChar, screenshotPath)
                .input("expected_results", sql.NVarChar, String(row[6] || "").trim())
                .input("remediation", sql.NVarChar, String(row[7] || "").trim())
                .input("existing_code", sql.NVarChar, String(row[8] || "").trim())
                .input("suggested_code", sql.NVarChar, String(row[9] || "").trim())
                .input("severity", sql.Int, severityId)
                .input("wcag_conformance_level", sql.Int, conformanceLevelId)
                .input("wcag_success_criteria", sql.NVarChar, String(row[12] || "").trim())
                .input("section_508", sql.NVarChar, String(row[13] || "").trim())
                .input("environments_applicable", sql.NVarChar, String(row[14] || "").trim())
                .input("template_issue", sql.NVarChar, String(row[15] || "").trim())
                .input("template_name", sql.NVarChar, String(row[16] || "").trim())
                .input("status", sql.VarChar, "Open")
                .query(`
                    -- INSERT INTO Category_Detail_Report_DEV 
                                        INSERT INTO Category_Detail_Report_v2 

                    (category_id, assessment_page_id, issue_name, actual_result, instances, 
                     screenshot, expected_results, remediation, existing_code, suggested_code,
                     severity, wcag_conformance_level, wcag_success_criteria, section_508,
                     environments_applicable, template_issue, template_name, status)
                    VALUES 
                    (@category_id, @assessment_page_id, @issue_name, @actual_result, @instances,
                     @screenshot, @expected_results, @remediation, @existing_code, @suggested_code,
                     @severity, @wcag_conformance_level, @wcag_success_criteria, @section_508,
                     @environments_applicable, @template_issue, @template_name, @status);
                `);
        }
        console.log("Tab 3 (Detailed Findings) with images processed successfully");
    }
}
        // ========================================
        // ✅ TAB 4: WCAG GUIDELINES
        // ========================================
        if (workbook.SheetNames.length > 3) {
            const tab4Name = workbook.SheetNames[3];
            const tab4Sheet = workbook.Sheets[tab4Name];
            const tab4Data = XLSX.utils.sheet_to_json(tab4Sheet, { header: 1, defval: "" });

            const wcagHeaderIndex = tab4Data.findIndex(r =>
                String(r[0]).toLowerCase().includes("guideline") ||
                String(r[1]).toLowerCase().includes("success criteria")
            );

            if (wcagHeaderIndex !== -1) {
                const wcagRows = tab4Data.slice(wcagHeaderIndex + 1);

                // Load guideline version mapping
                const guidelineVersionRef = await pool.request().query(`
                    SELECT guidline_version_id, guideline FROM Guideline_version;
                `);
                const guidelineVersionMap = {};
                guidelineVersionRef.recordset.forEach(row => {
                    guidelineVersionMap[row.guideline.trim().toLowerCase()] = row.guidline_version_id;
                });

                // Load compliance level mapping
                const complianceRef = await pool.request().query(`
                    SELECT level, compliance_level_id FROM Compliance_level;
                `);
                const complianceMap3 = {};
                complianceRef.recordset.forEach(row => {
                    complianceMap3[row.level.trim().toLowerCase()] = row.compliance_level_id;
                });

                const wcag21VersionId = guidelineVersionMap["wcag 2.1"] || guidelineVersionMap["2.1"] || 1;

                for (let row of wcagRows) {
                    const guideline = String(row[0] || "").trim();
                    const description = String(row[1] || "").trim();
                    const conformanceLevelRaw = String(row[2] || "").trim().toLowerCase();

                    if (!guideline || !description) continue;

                    let complianceLevelId = null;
                    if (conformanceLevelRaw.includes("level a") && !conformanceLevelRaw.includes("aa")) {
                        complianceLevelId = complianceMap3["level a"] || complianceMap3["a"];
                    } else if (conformanceLevelRaw.includes("level aa") && !conformanceLevelRaw.includes("aaa")) {
                        complianceLevelId = complianceMap3["level aa"] || complianceMap3["aa"];
                    } else if (conformanceLevelRaw.includes("level aaa") || conformanceLevelRaw === "aaa") {
                        complianceLevelId = complianceMap3["level aaa"] || complianceMap3["aaa"];
                    } else if (conformanceLevelRaw === "a") {
                        complianceLevelId = complianceMap3["a"] || complianceMap3["level a"];
                    } else if (conformanceLevelRaw === "aa") {
                        complianceLevelId = complianceMap3["aa"] || complianceMap3["level aa"];
                    }

                    if (!complianceLevelId) {
                        console.log(`Skipping WCAG guideline ${guideline} - invalid conformance level: ${conformanceLevelRaw}`);
                        continue;
                    }

                    // Check if exists
                    const existingGuideline = await transaction.request()
                        .input("assessment_id", sql.Int, assessmentId)
                        .input("guideline", sql.VarChar, guideline)
                        .input("guideline_version_id", sql.Int, wcag21VersionId)
                        .input("compliance_level_id", sql.Int, complianceLevelId)
                        .query(`
                            SELECT wcag_id 
                            -- FROM WCAG_DEV 
                            FROM WCAG

                            WHERE assessment_id = @assessment_id
                            AND guideline = @guideline 
                            AND guideline_version_id = @guideline_version_id
                            AND compliance_level_id = @compliance_level_id;
                        `);

                    if (existingGuideline.recordset.length === 0) {
                        await transaction.request()
                            .input("assessment_id", sql.Int, assessmentId)
                            .input("guideline_version_id", sql.Int, wcag21VersionId)
                            .input("compliance_level_id", sql.Int, complianceLevelId)
                            .input("guideline", sql.VarChar, guideline)
                            .input("description", sql.NVarChar, description)
                            .query(`
                                -- INSERT INTO WCAG_DEV 
                                INSERT INTO WCAG
                                (assessment_id, guideline_version_id, compliance_level_id, guideline, description)
                                VALUES (@assessment_id, @guideline_version_id, @compliance_level_id, @guideline, @description);
                            `);
                    }
                }
                console.log("Tab 4 (WCAG Guidelines) processed successfully");
            }
        }

        // Commit transaction
        await transaction.commit();

        return {
            assessment_id: assessmentId,
            service_id: service_id,
            conformance_score: conformanceScore,
            metadata: {
                prepared_for: preparedFor,
                report_date: reportDate
            },
            message: "Excel file processed successfully"
        };

    } catch (err) {
        if (transaction) {
            await transaction.rollback();
        }
        console.error('Error in uploadAccessibilityExcelService:', err);
        throw new AppError(
            err.message || 'Error processing Excel file',
            err.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        );
    }
};


exports.deleteAccessibilityReportService = async (assessment_id) => {
    const pool = await getConnectionPool();
    const transaction = pool.transaction();
    let isTransactionStarted = false;
    
    console.log("Deleting assessment with ID:", assessment_id);
    
    try {
        await transaction.begin();
        isTransactionStarted = true;

        // 1. Check if assessment exists
        const assessmentCheck = await transaction.request()
            .input('assessment_id', sql.Int, assessment_id)
            .query(`
                SELECT assessment_id 
                -- FROM Assessments_DEV 
                FROM Assessments_v2
                WHERE assessment_id = @assessment_id
            `);

        if (!assessmentCheck.recordset.length) {
            throw new AppError(
                ERROR_MESSAGES.ASSESSMENT_NOT_FOUND || 'Assessment not found',
                STATUS_CODES.NOT_FOUND
            );
        }

        // ✅ NEW: Get all screenshot paths before deleting
        const screenshotsResult = await transaction.request()
            .input('assessment_id', sql.Int, assessment_id)
            .query(`
                SELECT DISTINCT cdr.screenshot
                -- FROM Category_Detail_Report_DEV cdr
                FROM Category_Detail_Report_v2 cdr

                // INNER JOIN Assessments_Page_DEV ap 
                INNER JOIN Assessments_Page ap
                    ON cdr.assessment_page_id = ap.assessment_page_id
                WHERE ap.assessment_id = @assessment_id
                AND cdr.screenshot IS NOT NULL
                AND cdr.screenshot != '';
            `);

        const screenshotPaths = screenshotsResult.recordset.map(row => row.screenshot);
        console.log(`Found ${screenshotPaths.length} screenshots to delete`);

        // ================================
        // DELETE IN REVERSE ORDER
        // ================================

        // Delete Detailed Findings (child of Assessments_Page_DEV)
        const detailedFindingsResult = await transaction.request()
            .input('assessment_id', sql.Int, assessment_id)
            .query(`
                DELETE cdr
                -- FROM Category_Detail_Report_DEV cdr
                FROM Category_Detail_Report_v2 cdr

                // INNER JOIN Assessments_Page_DEV ap 
                INNER JOIN Assessments_Page ap
                    ON cdr.assessment_page_id = ap.assessment_page_id
                WHERE ap.assessment_id = @assessment_id;

                SELECT @@ROWCOUNT AS deleted_count;
            `);
        const detailedFindingsDeleted = detailedFindingsResult.recordset[0].deleted_count;

        // Delete Assessment Pages
        const pagesResult = await transaction.request()
            .input('assessment_id', sql.Int, assessment_id)
            .query(`
                -- DELETE FROM Assessments_Page_DEV
                DELETE FROM Assessments_Page
                WHERE assessment_id = @assessment_id;

                SELECT @@ROWCOUNT AS deleted_count;
            `);
        const pagesDeleted = pagesResult.recordset[0].deleted_count;

        // Delete WCAG Guidelines
        const wcagResult = await transaction.request()
            .input('assessment_id', sql.Int, assessment_id)
            .query(`
                -- DELETE FROM WCAG_DEV 
                DELETE FROM WCAG
                WHERE assessment_id = @assessment_id;

                SELECT @@ROWCOUNT AS deleted_count;
            `);
        const wcagDeleted = wcagResult.recordset[0].deleted_count;

        // Delete Top Issues
        const topIssuesResult = await transaction.request()
            .input('assessment_id', sql.Int, assessment_id)
            .query(`
                -- DELETE FROM Top_Accessibility_Issues_DEV 
                                DELETE FROM Top_Accessibility_Issues 

                WHERE assessment_id = @assessment_id;

                SELECT @@ROWCOUNT AS deleted_count;
            `);
        const topIssuesDeleted = topIssuesResult.recordset[0].deleted_count;

        // Delete Conformance Records
        const conformanceResult = await transaction.request()
            .input('assessment_id', sql.Int, assessment_id)
            .query(`
                -- DELETE FROM Assessment_conformance_DEV 
                DELETE FROM Assessment_conformance

                WHERE assessment_id = @assessment_id;

                SELECT @@ROWCOUNT AS deleted_count;
            `);
        const conformanceDeleted = conformanceResult.recordset[0].deleted_count;

        // Delete Severity Records
        const severityResult = await transaction.request()
            .input('assessment_id', sql.Int, assessment_id)
            .query(`
                -- DELETE FROM Assessment_severity_DEV 
                DELETE FROM Assessment_severity
                WHERE assessment_id = @assessment_id;

                SELECT @@ROWCOUNT AS deleted_count;
            `);
        const severityDeleted = severityResult.recordset[0].deleted_count;

        // Delete Report Metadata
        const metadataResult = await transaction.request()
            .input('assessment_id', sql.Int, assessment_id)
            .query(`
                -- DELETE FROM Assessment_Report_Metadata_DEV 
                DELETE FROM Assessment_Report_Metadata
                WHERE assessment_id = @assessment_id;

                SELECT @@ROWCOUNT AS deleted_count;
            `);
        const metadataDeleted = metadataResult.recordset[0].deleted_count;

        // ✅ NEW: Delete Testing Environment
        const testingEnvResult = await transaction.request()
            .input('assessment_id', sql.Int, assessment_id)
            .query(`
                -- DELETE FROM Assessment_Testing_Environment_DEV 
                DELETE FROM Assessment_Testing_Environment
                WHERE assessment_id = @assessment_id;

                SELECT @@ROWCOUNT AS deleted_count;
            `);
        const testingEnvDeleted = testingEnvResult.recordset[0].deleted_count;

        // Finally, Delete the Assessment itself
        await transaction.request()
            .input('assessment_id', sql.Int, assessment_id)
            .query(`
                -- DELETE FROM Assessments_DEV 
                DELETE FROM Assessments_v2

                WHERE assessment_id = @assessment_id;
            `);

        await transaction.commit();

        // ✅ NEW: Delete screenshot files from file system (after commit)
        const path = require('path');
        const fs = require('fs');
        let deletedFiles = 0;

        for (const screenshotPath of screenshotPaths) {
            try {
                const fullPath = path.join(__dirname, '../..', screenshotPath);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                    deletedFiles++;
                    console.log(`Deleted screenshot: ${screenshotPath}`);
                }
            } catch (err) {
                console.error(`Error deleting screenshot ${screenshotPath}:`, err);
            }
        }

        return {
            assessment_id: Number(assessment_id),
            deleted: true,
            summary: {
                detailed_findings: detailedFindingsDeleted,
                pages: pagesDeleted,
                wcag_guidelines: wcagDeleted,
                top_issues: topIssuesDeleted,
                conformance_records: conformanceDeleted,
                severity_records: severityDeleted,
                metadata_records: metadataDeleted,
                testing_environment_records: testingEnvDeleted,
                screenshot_files: deletedFiles
            },
            message: "Assessment and all related data deleted successfully"
        };

    } catch (err) {
        if (isTransactionStarted) {
            await transaction.rollback();
        }

        console.error('Error in deleteAccessibilityReportService:', err);

        throw new AppError(
            err.message || 'Error deleting accessibility report',
            err.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        );
    }
};

// const { sql, getConnectionPool } = require("../config/db");
// const { ERROR_MESSAGES, STATUS_CODES } = require("../utils/errorCodes");
// const { AppError } = require("../middlewares/errorHandler");

/**
 * Get all assessments for an organization with metadata
 */
exports.getOrgAssessmentsService = async (org_id) => {
    try {
        const pool = await getConnectionPool();

        const result = await pool.request()
            .input('org_id', sql.UniqueIdentifier, org_id)
            .query(`
                SELECT 
                    a.assessment_id,
                    a.service_id,
                    a.conformance_score,
                    a.status,
                    a.assessment_timestamp,
                    m.prepared_for,
                    m.report_date,
                    m.uploaded_at
                -- FROM Assessments_DEV a
                FROM Assessments_v2 a

                INNER JOIN Service s ON a.service_id = s.service_id
                -- LEFT JOIN Assessment_Report_Metadata_DEV m ON a.assessment_id = m.assessment_id
                LEFT JOIN Assessment_Report_Metadata m ON a.assessment_id = m.assessment_id

                WHERE s.org_id = @org_id
                ORDER BY a.assessment_timestamp DESC
            `);

        return result.recordset;

    } catch (err) {
        console.error('Error in getOrgAssessmentsService:', err);
        throw new AppError(
            err.message || 'Error fetching organization assessments',
            err.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        );
    }
};

/**
 * Get service_id for an organization (returns first service if multiple exist)
 */
exports.getOrgServiceService = async (org_id) => {
    try {
        const pool = await getConnectionPool();

        const result = await pool.request()
            .input('org_id', sql.UniqueIdentifier, org_id)
            .query(`
                SELECT TOP 1
                    service_id,
                    org_id,
                    web_url,
                    service_type_id,
                    created_at
                FROM Service
                WHERE org_id = @org_id
                ORDER BY created_at DESC
            `);

        if (!result.recordset.length) {
            throw new AppError(
                'No service found for this organization',
                STATUS_CODES.NOT_FOUND
            );
        }

        return result.recordset[0];

    } catch (err) {
        console.error('Error in getOrgServiceService:', err);
        throw new AppError(
            err.message || 'Error fetching organization service',
            err.status || STATUS_CODES.INTERNAL_SERVER_ERROR
        );
    }
};




