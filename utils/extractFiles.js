const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const parseSummaryReport = require('./parseSortSiteSummaryReport'); // Assuming function is exported
const parseDeepAccessibilityReport = require('./parseSortSiteDeepAccessibilityReport');
const { getConnectionPool, sql } = require('../config/db');
const { AppError } = require('../middlewares/errorHandler');
const { STATUS_CODES } = require('./errorCodes');
const summaryHeader = "Summary Report";
const deepAccessibilityHeader = "Deep Accessibility Report";


// Function to load and parse HTML file
function parseHTML(filePath) {
    console.log(`Parsed Full File Path: ${filePath}`);
    try {
        const html = fs.readFileSync(filePath, 'utf8');
        return html; // Return the HTML content as a string
    } catch (err) {
        console.error(`Error reading file at ${filePath}:`, err.message);
        process.exit(1);
    }
}

exports.extractFiles =async(inputFolder, outputFolder) => {

    
    //const inputFolder = process.argv[2]; // File path passed as the first argument
    const mainFile = `${inputFolder}Map.htm`;

    //const outputFolder = process.argv[3]; // Output file path passed as the second argument
    const summaryOutputFilePath = path.join(outputFolder, 'summary.json');
    const deepAccessibilieOutputFilePath = path.join(outputFolder, 'deepAccessibile.json');
    if (!mainFile || !path.isAbsolute(mainFile)) {
        console.error('Please provide an absolute HTML file path.');
        process.exit(1);
    }

    if (!fs.existsSync(outputFolder)) {
        console.error(`Output folder does not exist: ${outputFolder}`);
        process.exit(1);
    }

    // Parse the main file
    const summaryHtmlContent = parseHTML(mainFile);
    // Parse the HTML content to get the JSON array for summary
    const parsedSummaryData = parseSummaryReport(summaryHtmlContent);

    // Load the HTML content to access specific elements
    const $ = cheerio.load(summaryHtmlContent);
    // Find the link to the Accessibility page
    const link = $('a[href="map.ACC.htm"]').attr('href');

    
    let parsedDeepAccessibileData = null;
    if (link) {
        // Construct the full path to the linked file
        const linkedFilePath = path.isAbsolute(link) ? link : path.join(path.dirname(mainFile), link);
        console.log(`Accessible Full Path: ${linkedFilePath}`);

        const accessibileHtmlContent = parseHTML(linkedFilePath);
       // console.log("html",accessibileHtmlContent);
        // Parse the HTML content to get the JSON array for accessibility report
        // parsedAccessibileData = parseAccessibilityReport(accessibileHtmlContent);
        parsedDeepAccessibileData = parseDeepAccessibilityReport(accessibileHtmlContent);

    }
    // console.log("start");
    //    console.log(JSON.stringify(parsedDeepAccessibileData));
    //    console.log("end");
    try {
        const pool = await getConnectionPool();
        const result = await pool.request()
        .input('parsedSummaryData', sql.NVarChar(sql.MAX), JSON.stringify(parsedSummaryData))
        .input('parsedDeepAccessibileData', sql.NVarChar(sql.MAX), JSON.stringify(parsedDeepAccessibileData).replace(/\n/g, '\\n'))
        .execute('InsertFullAccessibilityData');
        console.log(result);
        return result;
    } catch (err) {
        console.error('Error executing stored procedure:', err.message);
        throw new AppError(err.message, STATUS_CODES.BAD_REQUEST)
    } 
}