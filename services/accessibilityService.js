const { sql, getConnectionPool } = require("../config/db");
const { ERROR_MESSAGES, STATUS_CODES } = require("../utils/errorCodes");
const { AppError } = require("../middlewares/errorHandler");

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