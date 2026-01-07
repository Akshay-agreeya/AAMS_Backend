const { sql, getConnectionPool } = require("../config/db");
const { ERROR_MESSAGES, STATUS_CODES } = require("../utils/errorCodes");
const { AppError } = require("../middlewares/errorHandler");
const XLSX = require("xlsx");

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
                FROM Assessments_DEV a
                LEFT JOIN Service s ON a.service_id = s.service_id
                WHERE a.assessment_id = @assessment_id
            `);

        if (!assessmentResult.recordset.length) {
            throw new AppError(
                ERROR_MESSAGES.ASSESSMENT_NOT_FOUND || 'Assessment not found',
                STATUS_CODES.NOT_FOUND
            );
        }

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
                FROM Assessment_conformance_DEV ac
                LEFT JOIN Guideline_version gv 
                    ON ac.wcag_id = gv.guidline_version_id
                LEFT JOIN Compliance_level cl 
                    ON ac.compliance_level_id = cl.compliance_level_id
                WHERE ac.assessment_id = @assessment_id
                ORDER BY cl.level;
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
                FROM Assessment_severity_DEV asev
                LEFT JOIN Severity_DEV s ON asev.severity = s.severity_id
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
                FROM Top_Accessibility_Issues_DEV
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
                FROM Assessments_Page_DEV
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
                FROM Category_Detail_Report_DEV cdr
                INNER JOIN Assessments_Page_DEV ap ON cdr.assessment_page_id = ap.assessment_page_id
                LEFT JOIN Category_Report cr ON cdr.category_id = cr.category_id
                LEFT JOIN Severity_DEV s ON cdr.severity = s.severity_id
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
                FROM WCAG_DEV w
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
exports.uploadAccessibilityExcelService = async (filePath, service_id) => {
    const pool = await getConnectionPool();
    const transaction = pool.transaction();

    try {
        await transaction.begin();

        // Read the Excel workbook
        const workbook = XLSX.readFile(filePath);

        // ========================================
        // TAB 1: ACCESSIBILITY OVERVIEW
        // ========================================
        const tab1Name = workbook.SheetNames[0];
        const tab1Sheet = workbook.Sheets[tab1Name];
        const tab1Data = XLSX.utils.sheet_to_json(tab1Sheet, { header: 1, defval: "" });

        let conformanceScore = 0;

        // Search for "conformance score" and its value
        for (let rowIndex = 0; rowIndex < tab1Data.length; rowIndex++) {
            const row = tab1Data[rowIndex];

            for (let col = 0; col < row.length; col++) {
                // Normalize cell value
                const cell = String(row[col] || "")
                    .replace(/\u00A0/g, " ")
                    .replace(/\s+/g, " ")
                    .trim()
                    .toLowerCase();

                if (cell === "conformance score") {
                    // Try next column first
                    let value = row[col + 1];

                    // If next column is empty, try next row same column
                    if (!value && rowIndex + 1 < tab1Data.length) {
                        value = tab1Data[rowIndex + 1][col];
                    }

                    if (value) {
                        const valueStr = String(value);

                        // Check if it's a decimal (Excel percentage format)
                        if (typeof value === 'number' && value < 1) {
                            conformanceScore = Math.round(value * 100);
                        }
                        // Check if it's a string with %
                        else if (valueStr.includes('%')) {
                            conformanceScore = parseInt(valueStr.replace("%", "").trim()) || 0;
                        }
                        // Otherwise try to parse as integer
                        else {
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

        // Create Assessment Record
        const assessmentResult = await transaction.request()
            .input("service_id", sql.Int, service_id)
            .input("conformance_score", sql.Int, conformanceScore)
            .input("status", sql.VarChar, "Completed")
            .input("assessment_timestamp", sql.DateTime2, new Date())
            .query(`
                INSERT INTO Assessments_DEV 
                (service_id, conformance_score, status, assessment_timestamp)
                OUTPUT INSERTED.assessment_id
                VALUES (@service_id, @conformance_score, @status, @assessment_timestamp);
            `);

        const assessmentId = assessmentResult.recordset[0].assessment_id;

        // ----------------------------------------
        // Extract WCAG Conformance Data
        // ----------------------------------------
        const wcagIndex = tab1Data.findIndex(r =>
            String(r[0]).toLowerCase().includes("wcag")
        );

        let wcagVersion = "";
        if (wcagIndex !== -1) {
            const header = String(tab1Data[wcagIndex][0]).trim();  // "WCAG 2.1 Conformance"
            wcagVersion = header.split(" ")[1]; // "2.1"
        }

        const wcagIdResult = await pool.request()
            .input("guideline", sql.VarChar, `WCAG ${wcagVersion}`)
            .query(`SELECT guidline_version_id FROM Guideline_version WHERE guideline = @guideline`);

        const wcagId = wcagIdResult.recordset[0]?.guidline_version_id;

        // Load compliance levels from DB
        const complianceLevels = await pool.request().query(`
                SELECT compliance_level_id, level
                FROM Compliance_level;
            `);

        const complianceMap = {};
        complianceLevels.recordset.forEach(row => {
            complianceMap[row.level.trim().toLowerCase()] = row.compliance_level_id;
        });

        const wcagRows = tab1Data.slice(wcagIndex + 1, wcagIndex + 3);

        for (let row of wcagRows) {
            const levelName = String(row[0] || "").trim();

            if (levelName.toLowerCase() === "total") continue;

            let complianceLevelId = null;

            // FIX ORDER: Match 'AA' first
            if (levelName.toLowerCase().includes("level aa")) {
                complianceLevelId = complianceMap["level aa"] || complianceMap["aa"];
            }
            else if (levelName.toLowerCase().includes("level a")) {
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
                        INSERT INTO Assessment_conformance_DEV
                        (assessment_id, wcag_id, passes_na, failed, compliance_level_id)
                        VALUES (@assessment_id, @wcag_id, @passes_na, @failed, @compliance_level_id);
                    `);
        }

        // ----------------------------------------
        // Extract Severity Data
        // ----------------------------------------
        const severityIndex = tab1Data.findIndex(r => String(r[0]).trim() === "Severity");

        if (severityIndex !== -1) {
            // Load severity reference from DB
            const severityRef = await pool.request().query(`
                SELECT severity_name, severity_id 
                FROM Severity_DEV;
            `);

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
                        INSERT INTO Assessment_severity_DEV 
                        (assessment_id, severity, no_of_issues, defect_score)
                        VALUES (@assessment_id, @severity, @no_of_issues, @defect_score);
                    `);
            }
        }
        console.log(tab1Data);
        // ----------------------------------------
        // Extract Top Accessibility Issues
        // ----------------------------------------
        const issueIndex = tab1Data.findIndex(r => {
            const cell = String(r[6] || "").replace(/\s+/g, " ").trim().toLowerCase();
            console.log("Checking row for Sr.No:", cell);
            return cell.includes("sr.no") || cell.includes("sr. no");
        });

        console.log("Issue index found at row:", issueIndex);

        if (issueIndex !== -1) {
            const issueRows = tab1Data.slice(issueIndex + 1, issueIndex + 6);

            console.log("Issue rows to process:", issueRows);

            for (let row of issueRows) {
                const issueTitle = String(row[7] || "").trim();

                console.log("Processing issue:", issueTitle);

                if (!issueTitle) continue;

                await transaction.request()
                    .input("assessment_id", sql.Int, assessmentId)
                    .input("issue_title", sql.VarChar, issueTitle)
                    .query(`
                        INSERT INTO Top_Accessibility_Issues_DEV 
                        (assessment_id, issue_title)
                        VALUES (@assessment_id, @issue_title);
                    `);
            }
        } else {
            console.log("Sr.No header not found in the Excel data");

            console.log("All values in column 6:");
            tab1Data.forEach((row, idx) => {
                if (row[6]) {
                    console.log(`Row ${idx}, Col 6:`, row[6]);
                }
            });
        }

        // ========================================
        // TAB 2: URL DETAILS
        // ========================================
        if (workbook.SheetNames.length > 1) {
            const tab2Name = workbook.SheetNames[1];
            const tab2Sheet = workbook.Sheets[tab2Name];
            const tab2Data = XLSX.utils.sheet_to_json(tab2Sheet, { header: 1, defval: "" });
            console.log("Tab 2 Data:", tab2Data);

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
                            INSERT INTO Assessments_Page_DEV 
                            (assessment_id, page_name, page_url, environments)
                            VALUES (@assessment_id, @page_name, @page_url, @environments);
                        `);
                }
            }
        }

        // ========================================
        // TAB 3: DETAILED FINDINGS
        // ========================================
        if (workbook.SheetNames.length > 2) {
            const tab3Name = workbook.SheetNames[2];
            const tab3Sheet = workbook.Sheets[tab3Name];
            const tab3Data = XLSX.utils.sheet_to_json(tab3Sheet, { header: 1, defval: "" });
            // console.log("Tab 3 Data:", tab3Data);

            const findingsHeaderIndex = tab3Data.findIndex(r =>
                String(r[2]).toLowerCase().includes("issue name") ||
                String(r[1]).toLowerCase().includes("issue#")
            );

            if (findingsHeaderIndex !== -1) {
                const findingsRows = tab3Data.slice(findingsHeaderIndex + 1);

                // Load severity and compliance level mappings
                const severityRef = await pool.request().query(`
                    SELECT severity_name, severity_id FROM Severity_DEV;
                `);
                const severityMap = {};
                severityRef.recordset.forEach(row => {
                    severityMap[row.severity_name.trim().toLowerCase()] = row.severity_id;
                });

                const complianceRef = await pool.request().query(`
                    SELECT level, compliance_level_id FROM Compliance_level;
                `);
                const complianceMap = {};
                complianceRef.recordset.forEach(row => {
                    complianceMap[row.level.trim().toLowerCase()] = row.compliance_level_id;
                });

                // Get assessment_page_id mapping
                const pagesResult = await transaction.request()
                    .input("assessment_id", sql.Int, assessmentId)
                    .query(`
                        SELECT assessment_page_id, page_name 
                        FROM Assessments_Page_DEV 
                        WHERE assessment_id = @assessment_id;
                    `);

                const pageMap = {};
                pagesResult.recordset.forEach(row => {
                    pageMap[row.page_name.trim().toLowerCase()] = row.assessment_page_id;
                });

                for (let row of findingsRows) {
                    const pageName = String(row[0] || "").trim();

                    if (!pageName) continue;

                    const assessmentPageId = pageMap[pageName.toLowerCase()];
                    if (!assessmentPageId) continue;

                    const severityName = String(row[10] || "").trim().toLowerCase();
                    const severityId = severityMap[severityName] || null;

                    const conformanceLevelName = String(row[11] || "").trim().toLowerCase();
                    const conformanceLevelId = complianceMap[conformanceLevelName] || null;

                    await transaction.request()
                        .input("category_id", sql.Int, 1)
                        .input("assessment_page_id", sql.Int, assessmentPageId)
                        .input("issue_name", sql.NVarChar, String(row[2] || "").trim())
                        .input("actual_result", sql.NVarChar, String(row[3] || "").trim())
                        .input("instances", sql.NVarChar, String(row[4] || "").trim())
                        .input("screenshot", sql.VarChar, String(row[5] || "").trim())
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
                            INSERT INTO Category_Detail_Report_DEV 
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
            }
        }

        // ========================================
        // TAB 4: WCAG GUIDELINES
        // ========================================
        if (workbook.SheetNames.length > 3) {
            const tab4Name = workbook.SheetNames[3];
            const tab4Sheet = workbook.Sheets[tab4Name];
            const tab4Data = XLSX.utils.sheet_to_json(tab4Sheet, { header: 1, defval: "" });

            // Find header row (Guideline | WCAG 2.1 Success Criteria Description | WCAG 2.1 Conformance Level)
            const wcagHeaderIndex = tab4Data.findIndex(r =>
                String(r[0]).toLowerCase().includes("guideline") ||
                String(r[1]).toLowerCase().includes("success criteria")
            );

            if (wcagHeaderIndex !== -1) {
                const wcagRows = tab4Data.slice(wcagHeaderIndex + 1);

                // Load guideline version mapping from DB
                const guidelineVersionRef = await pool.request().query(`
            SELECT guidline_version_id, guideline 
            FROM Guideline_version;
        `);
                const guidelineVersionMap = {};
                guidelineVersionRef.recordset.forEach(row => {
                    const name = row.guideline.trim().toLowerCase();
                    guidelineVersionMap[name] = row.guidline_version_id;
                });

                // Load compliance level mapping from DB
                const complianceRef = await pool.request().query(`
            SELECT level, compliance_level_id 
            FROM Compliance_level;
        `);
                const complianceMap = {};
                complianceRef.recordset.forEach(row => {
                    const name = row.level.trim().toLowerCase();
                    complianceMap[name] = row.compliance_level_id;
                });

                // Default guideline_version_id for WCAG 2.1 (should be 1)
                const wcag21VersionId = guidelineVersionMap["wcag 2.1"] ||
                    guidelineVersionMap["2.1"] ||
                    1;

                for (let row of wcagRows) {
                    const guideline = String(row[0] || "").trim();
                    const description = String(row[1] || "").trim();
                    const conformanceLevelRaw = String(row[2] || "").trim().toLowerCase();

                    // Skip empty rows
                    if (!guideline || !description) continue;

                    // Map conformance level to compliance_level_id
                    let complianceLevelId = null;

                    if (conformanceLevelRaw.includes("level a") && !conformanceLevelRaw.includes("aa")) {
                        complianceLevelId = complianceMap["level a"] || complianceMap["a"];
                    } else if (conformanceLevelRaw.includes("level aa") && !conformanceLevelRaw.includes("aaa")) {
                        complianceLevelId = complianceMap["level aa"] || complianceMap["aa"];
                    } else if (conformanceLevelRaw.includes("level aaa") || conformanceLevelRaw === "aaa") {
                        complianceLevelId = complianceMap["level aaa"] || complianceMap["aaa"];
                    } else if (conformanceLevelRaw === "a") {
                        complianceLevelId = complianceMap["a"] || complianceMap["level a"];
                    } else if (conformanceLevelRaw === "aa") {
                        complianceLevelId = complianceMap["aa"] || complianceMap["level aa"];
                    }

                    if (!complianceLevelId) {
                        console.log(`Skipping WCAG guideline ${guideline} - invalid conformance level: ${conformanceLevelRaw}`);
                        continue;
                    }

                    // Check if this guideline already exists for this assessment (to avoid duplicates)
                    const existingGuideline = await transaction.request()
                        .input("assessment_id", sql.Int, assessmentId)
                        .input("guideline", sql.VarChar, guideline)
                        .input("guideline_version_id", sql.Int, wcag21VersionId)
                        .input("compliance_level_id", sql.Int, complianceLevelId)
                        .query(`
                    SELECT wcag_id 
                    FROM WCAG_DEV 
                    WHERE assessment_id = @assessment_id
                    AND guideline = @guideline 
                    AND guideline_version_id = @guideline_version_id
                    AND compliance_level_id = @compliance_level_id;
                `);

                    // Only insert if it doesn't already exist for this assessment
                    if (existingGuideline.recordset.length === 0) {
                        await transaction.request()
                            .input("assessment_id", sql.Int, assessmentId)
                            .input("guideline_version_id", sql.Int, wcag21VersionId)
                            .input("compliance_level_id", sql.Int, complianceLevelId)
                            .input("guideline", sql.VarChar, guideline)
                            .input("description", sql.NVarChar, description)
                            .query(`
                        INSERT INTO WCAG_DEV 
                        (assessment_id, guideline_version_id, compliance_level_id, guideline, description)
                        VALUES (@assessment_id, @guideline_version_id, @compliance_level_id, @guideline, @description);
                    `);
                    }
                }
            }
        }

        // Commit transaction
        await transaction.commit();

        return {
            assessment_id: assessmentId,
            conformance_score: conformanceScore,
            message: "Excel file processed successfully"
        };

    } catch (err) {
        // Rollback transaction on error
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
                FROM Assessments_DEV a
                LEFT JOIN Service s ON a.service_id = s.service_id
                WHERE a.assessment_id = @assessment_id
            `);

        if (!assessmentResult.recordset.length) {
            throw new AppError(
                ERROR_MESSAGES.ASSESSMENT_NOT_FOUND || 'Assessment not found',
                STATUS_CODES.NOT_FOUND
            );
        }

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
                FROM Assessment_conformance_DEV ac
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
                FROM Assessment_severity_DEV asev
                LEFT JOIN Severity_DEV s ON asev.severity = s.severity_id
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
                FROM Top_Accessibility_Issues_DEV
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
                FROM Assessments_Page_DEV
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
                FROM Category_Detail_Report_DEV cdr
                INNER JOIN Assessments_Page_DEV ap ON cdr.assessment_page_id = ap.assessment_page_id
                LEFT JOIN Category_Report cr ON cdr.category_id = cr.category_id
                LEFT JOIN Severity_DEV s ON cdr.severity = s.severity_id
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
        // TAB 4: WCAG GUIDELINES
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
                FROM WCAG_DEV w
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
                FROM Assessments_DEV 
                WHERE assessment_id = @assessment_id
            `);

        if (!assessmentCheck.recordset.length) {
            throw new AppError(
                ERROR_MESSAGES.ASSESSMENT_NOT_FOUND || 'Assessment not found',
                STATUS_CODES.NOT_FOUND
            );
        }

        // ================================
        // DELETE IN REVERSE ORDER
        // ================================

        const detailedFindingsResult = await transaction.request()
            .input('assessment_id', sql.Int, assessment_id)
            .query(`
                DELETE cdr
                FROM Category_Detail_Report_DEV cdr
                INNER JOIN Assessments_Page_DEV ap 
                    ON cdr.assessment_page_id = ap.assessment_page_id
                WHERE ap.assessment_id = @assessment_id;

                SELECT @@ROWCOUNT AS deleted_count;
            `);
        const detailedFindingsDeleted = detailedFindingsResult.recordset[0].deleted_count;

        const pagesResult = await transaction.request()
            .input('assessment_id', sql.Int, assessment_id)
            .query(`
                DELETE FROM Assessments_Page_DEV 
                WHERE assessment_id = @assessment_id;

                SELECT @@ROWCOUNT AS deleted_count;
            `);
        const pagesDeleted = pagesResult.recordset[0].deleted_count;

        const wcagResult = await transaction.request()
            .input('assessment_id', sql.Int, assessment_id)
            .query(`
                DELETE FROM WCAG_DEV 
                WHERE assessment_id = @assessment_id;

                SELECT @@ROWCOUNT AS deleted_count;
            `);
        const wcagDeleted = wcagResult.recordset[0].deleted_count;

        const topIssuesResult = await transaction.request()
            .input('assessment_id', sql.Int, assessment_id)
            .query(`
                DELETE FROM Top_Accessibility_Issues_DEV 
                WHERE assessment_id = @assessment_id;

                SELECT @@ROWCOUNT AS deleted_count;
            `);
        const topIssuesDeleted = topIssuesResult.recordset[0].deleted_count;

        const conformanceResult = await transaction.request()
            .input('assessment_id', sql.Int, assessment_id)
            .query(`
                DELETE FROM Assessment_conformance_DEV 
                WHERE assessment_id = @assessment_id;

                SELECT @@ROWCOUNT AS deleted_count;
            `);
        const conformanceDeleted = conformanceResult.recordset[0].deleted_count;

        const severityResult = await transaction.request()
            .input('assessment_id', sql.Int, assessment_id)
            .query(`
                DELETE FROM Assessment_severity_DEV 
                WHERE assessment_id = @assessment_id;

                SELECT @@ROWCOUNT AS deleted_count;
            `);
        const severityDeleted = severityResult.recordset[0].deleted_count;

        await transaction.request()
            .input('assessment_id', sql.Int, assessment_id)
            .query(`
                DELETE FROM Assessments_DEV 
                WHERE assessment_id = @assessment_id;
            `);

        await transaction.commit();

        return {
            assessment_id: Number(assessment_id),
            deleted: true,
            summary: {
                detailed_findings: detailedFindingsDeleted,
                pages: pagesDeleted,
                wcag_guidelines: wcagDeleted,
                top_issues: topIssuesDeleted,
                conformance_records: conformanceDeleted,
                severity_records: severityDeleted
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
