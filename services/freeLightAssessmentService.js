const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const parseSummaryReport = require('../utils/parseSortSiteSummaryReport'); // Assuming function is exported
const parseDeepAccessibilityReport = require('../utils/parseSortSiteDeepAccessibilityReport');
const { getConnectionPool, sql } = require('../config/db');

const summaryHeader = "Summary Report";
const deepAccessibilityHeader = "Deep Accessibility Report";

let browser;

exports.freeLightAssementService = async (service_id, org_id, url) => {


    try {
        // console.log(`Launching browser to open: ${url}`);
        browser = await puppeteer.launch({ headless: true });

        const page = await browser.newPage();

        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        } catch (navError) {
            throw new Error(`Navigation failed: ${navError.message}`);
        }

        let summaryIframeContent, parsedSummaryData, parsedDeepAccessibilityData = [];

        try {
            await page.waitForSelector('iframe.embedFrame', { timeout: 10000 });
            const summaryFrameHandle = await page.$('iframe.embedFrame');
            const summaryFrame = await summaryFrameHandle.contentFrame();

            await summaryFrame.waitForSelector('body', { timeout: 10000 });
            summaryIframeContent = await summaryFrame.content();
            parsedSummaryData = parseSummaryReport(summaryIframeContent);
            // console.log("Parsed summary report.");
        } catch (summaryError) {
            throw new Error(`Failed to extract or parse summary report: ${summaryError.message}`);
        }

        await new Promise(resolve => setTimeout(resolve, 10000)); // Simple wait for stability

        try {
            const $ = cheerio.load(summaryIframeContent);
            const link = $('a[href="map.ACC.htm"]').attr('href');

            if (link) {
                const summaryFrame = await (await page.$('iframe.embedFrame')).contentFrame();
                const accLink = await summaryFrame.$(`a[href="${link}"]`);

                if (accLink) {
                    await accLink.click();
                    // console.log(`Clicked on Accessibility link: ${link}`);
                    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for iframe to load new content

                    const deepFrameHandle = await page.$('iframe.embedFrame');
                    const deepFrame = await deepFrameHandle.contentFrame();
                    const deepIframeContent = await deepFrame.content();

                    parsedDeepAccessibilityData = parseDeepAccessibilityReport(deepIframeContent);
                    // console.log("Parsed deep accessibility report.");
                } else {
                    console.warn("Accessibility link not found inside iframe.");
                }
            } else {
                console.warn("Accessibility link not present in summary HTML.");
            }
        } catch (accessError) {
            console.error(`Failed to extract deep accessibility report: ${accessError.message}`);
        }

        try {
            // console.log(`parsed data  `,parsedSummaryData,parsedDeepAccessibilityData);
            const pool = await getConnectionPool();
            const result = await pool.request()
                .input('ServiceID', sql.Int, service_id)
                .input('OrgID', sql.UniqueIdentifier, org_id)
                .input('parsedSummaryData', sql.NVarChar(sql.MAX), JSON.stringify(parsedSummaryData))
                .input('parsedDeepAccessibileData', sql.NVarChar(sql.MAX), JSON.stringify(parsedDeepAccessibilityData).replace(/\n/g, '\\n'))
                .execute('InsertFullAccessibilityDataReport');

            return result;
        } catch (error) {
            console.error(`Failed to generate Word document: ${error.message}`);
        }

    } catch (err) {
        console.error(`Unexpected error: ${err.message}`);
    } finally {
        if (browser) {
            try {
                await browser.close();
                console.log("Browser closed.");
            } catch (closeErr) {
                console.error(`Failed to close browser: ${closeErr.message}`);
            }
        }
    }
};