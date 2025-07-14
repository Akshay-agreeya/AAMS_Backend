const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

/**
 * Common utility functions for parsing HTML reports
 */
class CommonParserUtil {
    /**
     * Creates a logger function for a specific log file
     * @param {string} logFileName - Name of the log file
     * @returns {function} Logger function
     */
    static createLogger(logFileName) {
        const logFilePath = `./log/${logFileName}`;
        
        return function logMessage(message) {
            const timestamp = new Date().toISOString();
            const logEntry = `[${timestamp}] ${message}\n`;
            try {
                fs.appendFileSync(logFilePath, logEntry);
            } catch (error) {
                console.error(`Failed to write to log file: ${error.message}`);
            }
        };
    }

    /**
     * Maps level values to their corresponding priority/level system
     * @param {string} level - Original level value
     * @param {string} mappingType - Type of mapping ('accessibility' or 'priority')
     * @returns {string} Mapped level value
     */
    static mapLevel(level, mappingType = 'priority') {
        if (mappingType === 'accessibility') {
            switch (level) {
                case 'Critical': return 'A';
                case 'Very Important': return 'AA';
                case 'Important': return 'AAA';  // Fixed: was 'Less Important'
                default: return level;
            }
        } else {
            // Default priority mapping
            switch (level) {
                case 'Critical': return 'Priority 1';
                case 'Very Important': return 'Priority 2';
                case 'Important': return 'Priority 3';
                default: return level;
            }
        }
    }

    /**
     * Extracts and processes level information from table cells
     * @param {*} cells - jQuery/Cheerio cells object
     * @param {string} mappingType - Type of level mapping to apply
     * @param {*} $ - Cheerio instance
     * @returns {string} Processed level value
     */
    static extractLevel(cells, mappingType = 'priority', $) {
        const levelImg = cells.eq(0).find('img.absmiddle');
        const dynamicImg = levelImg.filter((_, img) => {
            const src = $(img).attr('src');  // Fixed: use passed $ instance
            const alt = $(img).attr('alt');  // Fixed: use passed $ instance
            return src?.startsWith("https://try.powermapper.com/vres/") && alt;
        });

        const level = dynamicImg.length > 0 ? dynamicImg.attr('alt') : 'Not Available';
        return this.mapLevel(level, mappingType);
    }

    /**
     * Extracts and processes rules/guidelines from table cells
     * @param {*} rulesCell - jQuery/Cheerio rules cell object
     * @param {*} $ - Cheerio instance
     * @returns {string|Array} Processed rules data
     */
    static extractRules(rulesCell, $) {
        if (rulesCell.find('a').length > 0) {
            return rulesCell.find('a').map(function () {
                let href = $(this).attr('href');  // Fixed: use passed $ instance
                if (href && href.includes('usegov')) {
                    href = 'https://digital.gov/topics/usability/';
                }
                return {
                    text: $(this).text().trim(),  // Fixed: use passed $ instance
                    link: href,
                };
            }).get();
        } else {
            return rulesCell.text().trim();
        }
    }

    /**
     * Extracts failing page count from pages text
     * @param {string} pages - Pages text content
     * @returns {string} Extracted page count or original text
     */
    static extractFailingPages(pages) {
        const match = pages.match(/(\d+)\s+pages/);
        return match ? match[1] : pages;
    }

    /**
     * Parses expando section for nested table data, remediation, and criteria
     * @param {*} $expandoTbody - jQuery/Cheerio expando tbody element
     * @param {function} logMessage - Logger function
     * @returns {{nestedTableData: Array, remediation: string|null, criteria: string|null}}
     */
    static parseExpando($expandoTbody, logMessage) {
        const result = [];
        let currentDetails = [];
        let remediation = null;
        let criteria = null;

        try {
            const rows = $expandoTbody.find('tr').toArray();

            for (let i = 0; i < rows.length; i++) {
                const $row = cheerio.load(rows[i])('tr');

                if (i === 0) {
                    const tdElements = $row.find('td');
                    if (tdElements.length > 2) {
                        remediation = tdElements.eq(1).text().trim() || null;
                        criteria = tdElements.eq(2).text().trim() || null;
                    }
                    continue;
                }

                const anchor = $row.find('a');
                const urlText = anchor.text().trim();
                const href = anchor.attr('href');

                const codeText = $row.find('code').text().trim();
                const lineMatch = $row.text().match(/Line\s*(\d+)/i);
                const lineNumber = lineMatch ? lineMatch[1] : null;

                const isPageURL = urlText.startsWith('http') || (href && href.startsWith('http'));

                if (codeText && lineNumber) {
                    currentDetails.push({
                        Description: codeText,
                        LineNumbers: lineNumber
                    });
                    continue;
                }

                if (isPageURL && currentDetails.length > 0) {
                    result.push({
                        PageURL: {
                            text: urlText,
                            link: urlText
                        },
                        Details: currentDetails
                    });
                    currentDetails = [];
                }
            }
        } catch (error) {
            logMessage(`Error parsing expando section: ${error.message}`);
        }

        return { nestedTableData: result, remediation, criteria };
    }

    /**
     * Main parsing function that processes HTML reports
     * @param {string} html - HTML string to parse
     * @param {string} reportType - Type of report for logging and header
     * @param {string} mappingType - Level mapping type ('accessibility' or 'priority')
     * @returns {Array} Parsed report data
     */
    static parseReport(html, reportType, mappingType = 'priority') {
        const logMessage = this.createLogger(`parseSortSiteDeep${reportType}Report.log`);
        const dataArray = [];

        try {
            const $ = cheerio.load(html);

            $('table.issues tbody:not(.expando)').each(function () {
                const $mainTbody = $(this);

                $mainTbody.find('tr[id]').each(function () {
                    try {
                        const cells = $(this).find('td');
                        if (cells.length < 4) return;

                        // Pass the $ instance to the extraction methods
                        const modifiedLevel = CommonParserUtil.extractLevel(cells, mappingType, $);
                        const issueDescription = cells.eq(1).text().trim();
                        const rules = CommonParserUtil.extractRules(cells.eq(2), $);
                        const pages = cells.eq(3).text().trim();
                        const failingPage = CommonParserUtil.extractFailingPages(pages);

                        const $expandoTbody = $mainTbody.next('.expando');
                        let nestedTableData = [];
                        let remediation = null;
                        let criteria = null;

                        if ($expandoTbody.length > 0) {
                            const expandoResult = CommonParserUtil.parseExpando($expandoTbody, logMessage);
                            nestedTableData = expandoResult.nestedTableData;
                            remediation = expandoResult.remediation;
                            criteria = expandoResult.criteria;
                        }

                        const rowData = {
                            Criteria: criteria,
                            'Issue Description': issueDescription,
                            Remediation: remediation,
                            Level: modifiedLevel,
                            'Failing Page': failingPage,
                            Guideline: rules,
                            nestedTableData: nestedTableData
                        };

                        dataArray.push(rowData);
                    } catch (innerError) {
                        logMessage(`Error parsing row: ${innerError.message}`);
                    }
                });
            });
        } catch (outerError) {
            logMessage(`Error parsing ${reportType} report HTML: ${outerError.message}`);
        }

        logMessage(`Parsed data: ${JSON.stringify(dataArray, null, 2)}`);
        console.log(`${reportType} Parsed data: ${JSON.stringify(dataArray, null, 2)}`);
        
        return [
            {
                header: `Deep ${reportType} Report`,
                data: dataArray,
                reportType: "Deep"
            }
        ];
    }

    /**
     * Simplified parsing function for basic accessibility reports
     * @param {string} html - HTML string to parse
     * @returns {Array} Parsed report data
     */
    static parseBasicAccessibilityReport(html) {
        const $ = cheerio.load(html);
        const dataArray = [];

        $('table.issues tbody:not(.expando)').each(function () {
            $(this).find('tr[id]').each(function () {
                const cells = $(this).find('td');

                if (cells.length > 0) {
                    const levelImg = cells.eq(0).find('button + img[src^="Report"][class="absmiddle"]');
                    const level = levelImg.length > 0 ? levelImg.attr('alt') : 'Not Available';
                    const modifiedLevel = CommonParserUtil.mapLevel(level, 'accessibility');

                    const issue = cells.eq(1).text().trim();
                    const rules = cells.eq(2).find('a').length > 0 ? 
                        cells.eq(2).find('a').first().text() : 
                        cells.eq(2).text().trim();
                    const pages = cells.eq(3).text().trim();
                    const failingPage = CommonParserUtil.extractFailingPages(pages);

                    dataArray.push({
                        Level: modifiedLevel,
                        'Issue Description': issue,
                        Guideline: rules,
                        'Failing Page': failingPage
                    });
                }
            });
        });

        return dataArray;
    }
}

module.exports = CommonParserUtil;