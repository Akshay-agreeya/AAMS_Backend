
const cheerio = require('cheerio');

/**
 * Parses the summary report from an HTML string and returns a structured JSON array.
 * @param {string} html - The HTML string containing the report.
 * @returns {Array<Object>} - A structured array with header, data, and reportType.
 */
function parseSummaryReport(html) {
    const $ = cheerio.load(html);
    const dataArray = [];

    // Select the table rows
    const rows = $('table.summary tbody tr');

    // Extract each row's data
    rows.each(function () {
        const cells = $(this).find('td');
        const category = cells.eq(0).text().trim();
        const issues = cells.eq(1).text().trim();
        const pages = cells.eq(2).text().trim();
        const benchmark = cells.eq(3).text().trim();

        if (category && pages) {
            dataArray.push({
                Category: category,
                Issues: issues,
                Pages: pages,
                Benchmark: benchmark
            });
        }
    });

    // Wrap the data array in the desired format
    return [
        {
            header: "Summary Report",
            data: dataArray,
            reportType: "summary"
        }
    ];
}

module.exports = parseSummaryReport;
