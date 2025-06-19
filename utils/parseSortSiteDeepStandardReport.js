const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const logFilePath = './log/parseSortSiteDeepStandardReport.log';

/**
 * Appends a timestamped message to the log file.
 * @param {string} message
 */
function logMessage(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  try {
    fs.appendFileSync(logFilePath, logEntry);
  } catch (error) {
    console.error(`Failed to write to log file: ${error.message}`);
  }
}

/**
 * Parses the expando section for nested table data, remediation, and criteria.
 * @param {*} $expandoTbody
 * @returns {{nestedTableData: array, remediation: string|null, criteria: string|null}}
 */
function parseStandardExpando($expandoTbody) {
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
 * Parses the full accessibility report HTML into structured data.
 * @param {string} html
 * @returns {Array<Object>}
 */
function parseDeepStandardReport(html) {
  const dataArray = [];

  try {
    const $ = cheerio.load(html);

    $('table.issues tbody:not(.expando)').each(function () {
      const $mainTbody = $(this);

      $mainTbody.find('tr[id]').each(function () {
        try {
          const cells = $(this).find('td');
          if (cells.length < 4) return;

          const levelImg = cells.eq(0).find('img.absmiddle');
          const dynamicImg = levelImg.filter((_, img) => {
            const src = $(img).attr('src');
            const alt = $(img).attr('alt');
            return src?.startsWith("https://try.powermapper.com/vres/") && alt;
          });

          const level = dynamicImg.length > 0 ? dynamicImg.attr('alt') : 'Not Available';
          const modifiedLevel =
            level === 'Critical' ? 'Priority 1' :
              level === 'Very Important' ? 'Priority 2' :
                level === 'Important' ? 'Priority 3' :
                  level;

          const issueDescription = cells.eq(1).text().trim();

          const rulesCell = cells.eq(2);
          let rules;
          if (rulesCell.find('a').length > 0) {
            rules = rulesCell.find('a').map(function () {
              let href = $(this).attr('href');
              if (href && href.includes('usegov')) {
                href = 'https://digital.gov/topics/usability/';
              }
              return {
                text: $(this).text().trim(),
                link: href,
              };
            }).get();
          } else {
            rules = rulesCell.text().trim();
          }


          const pages = cells.eq(3).text().trim();
          const failingPage = pages.match(/(\d+)\s+pages/)?.[1] || pages;

          const $expandoTbody = $mainTbody.next('.expando');
          let nestedTableData = [];
          let remediation = null;
          let criteria = null;

          if ($expandoTbody.length > 0) {
            const expandoResult = parseStandardExpando($expandoTbody);
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
    logMessage(`Error parsing Standard report HTML: ${outerError.message}`);
  }

  logMessage(`Parsed data: ${JSON.stringify(dataArray, null, 2)}`);
  console.log(JSON.stringify(dataArray, null, 2));
  return dataArray;
}

module.exports = parseDeepStandardReport;
