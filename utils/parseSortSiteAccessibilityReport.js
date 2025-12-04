const cheerio = require('cheerio');

/**
 * Parses the accessibility report from an HTML string and returns a JSON array of objects.
 * @param {string} html - The HTML string containing the report.
 * @returns {Array<Object>} - An array of objects representing the summary report data.
 */
function parseAccessibilityReport(html) {
    // Log the raw HTML input (truncated to 1000 chars for safety)
    console.log('--- Raw HTML input to parser (truncated) ---');
    console.log(html ? html.substring(0, 1000) : '[No HTML provided]');

    // Initialize Cheerio with the HTML
    const $ = cheerio.load(html);

    // Array to store the extracted data
    const dataArray = [];

    // Select all tbody elements that do not have the class "expando" within the table class "issues"
    $('table.issues tbody:not(.expando)').each(function () {
        // Within each tbody, find all rows with an id
        $(this).find('tr[id]').each(function () {
            const cells = $(this).find('td');

            // Check if the row contains data we want
            if (cells.length > 0) {
                // Select the img tag that is parallel to the button
                const levelImg = cells.eq(0).find('button + img[src^="Report"][class="absmiddle"]');
                const level = levelImg.length > 0 ? levelImg.attr('alt') : 'Not Available'; // Level

                // Modify Level based on conditions
                let modifiedLevel;
                if (level === 'Critical') {
                    modifiedLevel = 'A';
                } else if (level === 'Very Important') {
                    modifiedLevel = 'AA';
                } else if (level === 'Less Important') {
                    modifiedLevel = 'AAA';
                } else {
                    modifiedLevel = level; // Leave as is
                }

                const issue = cells.eq(1).text().trim(); // Issue description
                //const rules = cells.eq(2).find('a').map((i, el) => $(el).text()).get().join(', '); // Rules
                const rules = cells.eq(2).find('a').length > 0 ? cells.eq(2).find('a').first().text() : cells.eq(2).text().trim(); // Otherwise, get the text directly from the cell
                const pages = cells.eq(3).text().trim(); // Pages
                const valueBeforePages = pages.match(/(\d+)\s+pages/) ? pages.match(/(\d+)\s+pages/)[1] : pages;

                // Push the extracted data to the array
                dataArray.push({
                    Level: modifiedLevel,
                    'Issue Description': issue,
                    Guideline: rules,
                    'Failing Page': valueBeforePages
                });
            }
        });
    });

    if (dataArray.length === 0) {
        console.warn('No accessibility issues found. Check if the report format has changed or if the scan failed.');
    }
    console.log(dataArray);
    return dataArray;
}

module.exports = parseAccessibilityReport;