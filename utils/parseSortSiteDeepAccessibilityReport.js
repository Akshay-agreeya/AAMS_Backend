const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

//const logFilePath = path.join(__dirname, '../log/', 'parseDeepAccessibilityReport.log');



/**
 * Parses the accessibility report from an HTML string and returns a JSON array of objects.
 * @param {string} html - The HTML string containing the report.
 * @returns {Array<Object>} - An array of objects representing the summary report data.
 */
function parseDeepAccessibilityReport(html) {
    const $ = cheerio.load(html);
    const dataArray = [];

    $('table.issues tbody:not(.expando)').each(function () {
        const $mainTbody = $(this);

        $mainTbody.find('tr[id]').each(function () {
            const cells = $(this).find('td');

            if (cells.length > 0) {
                const levelImg = cells.eq(0).find('button + img[src^="Report"][class="absmiddle"]');
                const level = levelImg.length > 0 ? levelImg.attr('alt') : 'Not Available';

                let modifiedLevel;
                if (level === 'Critical') {
                    modifiedLevel = 'A';
                } else if (level === 'Very Important') {
                    modifiedLevel = 'AA';
                } else if (level === 'Less Important') {
                    modifiedLevel = 'AAA';
                } else {
                    modifiedLevel = level;
                }

                const issue = cells.eq(1).text().trim();
                const rulesCell = cells.eq(2);
                let rules;

                // Check if there are any anchor tags in the rules cell
                if (rulesCell.find('a').length > 0) {
                    // Create a JSON object for rules
                    const rulesArray = rulesCell.find('a').map(function () {
                        return {
                            text: $(this).text().trim(), // Get the text of the link
                            link: $(this).attr('href'),   // Get the URL from the anchor tag
                        };
                    }).get(); // Convert the jQuery object to a regular array

                    rules = rulesArray; // Assign the JSON array to rules
                } else {
                    // If no anchor tags, keep the existing text
                    rules = rulesCell.text().trim();
                }

                const pages = cells.eq(3).text().trim();
                const valueBeforePages = pages.match(/(\d+)\s+pages/) ? pages.match(/(\d+)\s+pages/)[1] : pages;

                const rowData = {
                    Criteria: null,
                    'Issue Description': issue,
                    Remediation: null,
                    Level: modifiedLevel,
                    'Failing Page': valueBeforePages,
                    Guideline: rules, // Use the modified rules here
                };

                const $expandoTbody = $mainTbody.next('.expando');
                if ($expandoTbody.length > 0) {
                    const expandoRows = $expandoTbody.find('tr');

                    // Initialize an array to store Page URL and Line Numbers pairs
                    const pageDataArray = [];

                    expandoRows.each(function () {
                        const currentTr = $(this);
                        const anchorTags = currentTr.find('td').eq(1).find('a');

                        // Check if there are any <a> tags in the row
                        if (anchorTags.length > 0) {
                            // For each <a> tag, extract its Page URL and Line Numbers
                            anchorTags.each(function () {
                                const url = $(this).attr('href');
                                const text = $(this).text(); // Get the text of the link for display

                                // Get all Line Numbers associated with this page URL from the second <td>
                                const lineNumbers = currentTr.find('td').eq(2).find('a')
                                    .map(function () {
                                        return $(this).attr('data-line');
                                    })
                                    .get()
                                    .join(', ');

                                // Get the text from all <code> tags before the <a> tag
                                const codeTexts = currentTr.find('td').eq(1).find('code')
                                    .map(function () {
                                        return $(this).text().trim(); // Get the text and trim any extra whitespace
                                    })
                                    .get()
                                    .join(', '); // Join all code texts into a single string, separated by commas

                                // Push the URL, Line Numbers, and Description as an object to the array
                                pageDataArray.push({
                                    PageURL: {
                                        text: text, // Add display text for hyperlink
                                        link: url // Add URL
                                    },
                                    Description: codeTexts,
                                    LineNumbers: lineNumbers
                                });
                            });
                        } else {
                            // Logic for rows without <a> tags
                            const firstColumnText = currentTr.find('td').eq(1).text().trim();
                            const secondColumnText = currentTr.find('td').eq(2).text().trim();

                            if (!rowData.Remediation) {
                                rowData.Remediation = firstColumnText;
                            }

                            if (!rowData.Criteria && secondColumnText) {
                                rowData.Criteria = secondColumnText;
                            }
                        }
                    });

                    // Store the array of Page URL and Line Number objects in the rowData
                    rowData.nestedTableData = pageDataArray;
                }

                dataArray.push(rowData);
            }
        });
    });

    // Properly print the array of objects, including nested objects
   
    console.log(JSON.stringify(dataArray, null, 2)); // Convert to readable JSON format with indentation
    return dataArray;
}

module.exports = parseDeepAccessibilityReport;
