const XLSX = require("xlsx");
const { getConnectionPool, sql } = require("../config/db");

exports.uploadA11yExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const workbook = XLSX.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const pool = await getConnectionPool();

        /* -----------------------------------------
         * 1️⃣ Load REAL severity IDs from DB
         * ----------------------------------------- */
        const severityRef = await pool.request().query(`
            SELECT severity_name, severity_id 
            // FROM Severity_DEV;
            FROM Severity;

            `);

        const severityMap = {};
        severityRef.recordset.forEach(row => {
            severityMap[row.severity_name.trim()] = row.severity_id;
        });

        /* -----------------------------------------
         * 2️⃣ Extract Severity Table
         * ----------------------------------------- */
        const sevIndex = data.findIndex(r => r[0] === "Severity");
        const sevRows = data.slice(sevIndex + 1, sevIndex + 6);

        const severityData = sevRows.map(r => {
            const name = (r[0] || "").trim();

            if (!severityMap[name]) {
                console.log("Skipping invalid severity:", name);
                return null;
            }

            let score = r[2];
            if (typeof score !== "number") score = 0;

            return {
                severityId: severityMap[name],
                issues: parseInt(r[1]) || 0,
                score
            };
        }).filter(Boolean);

        /* -----------------------------------------
         * 3️⃣ Extract Top 5 Issues
         * ----------------------------------------- */
        const issueIndex = data.findIndex(r => r[0] === "Sr.No");
        const issueRows = data.slice(issueIndex + 1, issueIndex + 6);

        const issues = issueRows.map(r => ({
            issue_title: r[1] || ""
        }));

        /* -----------------------------------------
         * 4️⃣ INSERT PARENT RECORD FIRST
         * ----------------------------------------- */
        const assessmentResult = await pool.request()
            .input("service_id", sql.Int, 1)
            .input("assessment_date", sql.Date, new Date())
            .input("org_id", sql.VarChar, "F0DDC1D2-3996-488B-BCF3-E9AD9C8128A6") // your org
            .input("accessibility_score", sql.Int, 0)
            .input("status", sql.VarChar, "Completed")
            .query(`
                INSERT INTO Assessments 
                (service_id, assessment_date, org_id, accessibility_score, status)
                OUTPUT INSERTED.assessment_id
                VALUES (@service_id, @assessment_date, @org_id, @accessibility_score, @status);
            `);

        const assessmentId = assessmentResult.recordset[0].assessment_id;

        /* -----------------------------------------
         * 5️⃣ Insert Severity Data
         * ----------------------------------------- */
        for (let row of severityData) {
            await pool.request()
                .input("assessment_id", sql.Int, assessmentId)
                .input("severity", sql.Int, row.severityId)
                .input("no_of_issues", sql.Int, row.issues)
                .input("defect_score", sql.Float, row.score)
                .query(`
                    // INSERT INTO Assessment_severity_DEV 
                    INSERT INTO Assessment_severity

                    (assessment_id, severity, no_of_issues, defect_score)
                    VALUES (@assessment_id, @severity, @no_of_issues, @defect_score);
                `);
        }

        /* -----------------------------------------
         * 6️⃣ Extract WCAG Conformance Table
         * ----------------------------------------- */
        const wcagIndex = data.findIndex(r => r[0] === "WCAG 2.1 Conformance");
        const wcagRows = data.slice(wcagIndex + 1, wcagIndex + 4);

        const wcagData = [];

        wcagRows.forEach(r => {
            const level = (r[0] || "").trim();

            if (level.toLowerCase() === "total") return;

            let wcagId = 0;
            if (level === "Level A") wcagId = 1;
            if (level === "Level AA") wcagId = 2;

            if (!wcagId) return;

            wcagData.push({
                wcagId,
                passes: parseInt(r[1]) || 0,
                failed: parseInt(r[2]) || 0
            });
        });

        /* -----------------------------------------
         * 7️⃣ Insert WCAG Conformance
         * ----------------------------------------- */
        for (let row of wcagData) {
            await pool.request()
                .input("assessment_id", sql.Int, assessmentId)
                .input("wcag_id", sql.Int, row.wcagId)
                .input("passes_na", sql.Int, row.passes)
                .input("failed", sql.Int, row.failed)
                .query(`
                    // INSERT INTO Assessment_conformance_DEV
                    INSERT INTO Assessment_conformance

                    (assessment_id, wcag_id, passes_na, failed)
                    VALUES (@assessment_id, @wcag_id, @passes_na, @failed);
                `);
        }

        /* -----------------------------------------
         * 8️⃣ Insert Top Issues (MASTER + MAPPING)
         * ----------------------------------------- */
        for (let item of issues) {
            const cleanTitle = (item.issue_title || "").trim();
            if (!cleanTitle) continue;

            let issueResult = await pool.request()
                .input("title", sql.VarChar, cleanTitle)
                .query(`
                    SELECT issue_id 
                    // FROM Top_Accessibility_Issues_DEV
                    FROM Top_Accessibility_Issues

                    WHERE issue_title = @title;
                `);

            let issueId;

            if (issueResult.recordset.length === 0) {
                const insertIssue = await pool.request()
                    .input("title", sql.VarChar, cleanTitle)
                    .query(`
                        // INSERT INTO Top_Accessibility_Issues_DEV (issue_title)
                        INSERT INTO Top_Accessibility_Issues (issue_title)

                        OUTPUT INSERTED.issue_id
                        VALUES (@title);
                    `);

                issueId = insertIssue.recordset[0].issue_id;
            } else {
                issueId = issueResult.recordset[0].issue_id;
            }

            await pool.request()
                .input("assessment_id", sql.Int, assessmentId)
                .input("issue_id", sql.Int, issueId)
                .query(`
                    // INSERT INTO Top_Accessibility_Issues_DEV (assessment_id, issue_id)
                    INSERT INTO Top_Accessibility_Issues (assessment_id, issue_id)

                    VALUES (@assessment_id, @issue_id);
                `);
        }

        /* -----------------------------------------
         * DONE!
         * ----------------------------------------- */
        res.json({ message: "Excel data saved successfully!" });

    } catch (err) {
        console.error("Upload error:", err);
        res.status(500).json({ error: err.message });
    }
};
