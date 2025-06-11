const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const parseSummaryReport = require('../utils/parseSortSiteSummaryReport'); // Assuming function is exported
const parseDeepAccessibilityReport = require('../utils/parseSortSiteDeepAccessibilityReport');
const parseDeepUsabilityReport = require('../utils/parseSortSiteDeepUsabilityReport')
const { getConnectionPool, sql } = require('../config/db');


async function waitForIframe(page, selector, maxWaitMs = 6 * 60 * 60 * 1000, checkInterval = 15000) {
    const start = Date.now();
    while ((Date.now() - start) < maxWaitMs) {
        try {
            const frameHandle = await page.$(selector);
            if (frameHandle) {
                const frame = await frameHandle.contentFrame();
                if (frame) {
                    console.log("Iframe is available.");
                    return frame;
                }
            }
        } catch (e) {
            // Ignore and continue retrying
        }
        console.log("Waiting for iframe to load...");
        await new Promise(r => setTimeout(r, checkInterval));
    }
    throw new Error(`Timed out after ${maxWaitMs / 60000} minutes waiting for iframe.`);
}


exports.freeLightAssementService = async (service_id, org_id, url) => {


    let browser;

    try {
        console.log(`Launching browser...`);
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        await page.goto("https://www.powermapper.com/products/sortsite/try/", {
            waitUntil: 'networkidle2',
            timeout: 60000,
        });

        await page.waitForSelector('#home-scan-url', { timeout: 10000 });
        await page.type('#home-scan-url', url);
        await page.click('button.btn.btn-primary');
        console.log(`Submitted URL for scan: ${url}`);

        const summaryFrame = await waitForIframe(page, 'iframe.embedFrame');
        const summaryHTML = await summaryFrame.content();
        const parsedSummaryData = parseSummaryReport(summaryHTML);
        console.log("Summary report parsed.");

        const $ = cheerio.load(summaryHTML);
        const accLinkHref = $('a[href="map.ACC.htm"]').attr('href');
        const useLinkHref = $('a[href="map.USE.htm"]').attr('href');

        let parsedDeepAccessibilityData = [];
        if (accLinkHref) {
            const accLink = await summaryFrame.$(`a[href="${accLinkHref}"]`);
            if (accLink) {
                await accLink.click();
                console.log(`Navigated to deep accessibility report: ${accLinkHref}`);
                await new Promise(r => setTimeout(r, 10000));

                const deepFrameHandle = await page.$('iframe.embedFrame');
                const deepFrame = await deepFrameHandle.contentFrame();
                const deepHTML = await deepFrame.content();

                parsedDeepAccessibilityData = parseDeepAccessibilityReport(deepHTML);

                console.log("Deep accessibility report parsed.");
            } else {
                console.warn("Accessibility link not clickable.");
            }
        } else {
            console.warn("Accessibility link not found in summary.");
        }

        const backToSummary = await summaryFrame.$('a[href="map.htm"]');
        if (backToSummary) {
          await backToSummary.click();
          console.log('Navigated back to Summary.');
          await new Promise(r => setTimeout(r, 10000));
        } else {
          console.warn('Summary link (map.htm) not found in iframe.');
        }
        let parsedDeepUsabilityData = [];
        if (useLinkHref) {
          const useLink = await summaryFrame.$(`a[href="${useLinkHref}"]`);
          if (useLink) {
            await useLink.click();
            console.log(`Navigated to deep usability report: ${useLinkHref}`);
            await new Promise(r => setTimeout(r, 10000));
    
            const deepUsabilityFrameHandle = await page.$('iframe.embedFrame');
            const deepUsabilityFrame = await deepUsabilityFrameHandle.contentFrame();
            const deepUsabilityHTML = await deepUsabilityFrame.content();
    
            parsedDeepUsabilityData = parseDeepUsabilityReport(deepUsabilityHTML);
            console.log("Deep usability report parsed.");
          } else {
            console.warn("Usability link not clickable.");
          }
        } else {
          console.warn("Usability link not found in summary.");
        }

        try {
            // console.log(`parsed data  `,parsedSummaryData,parsedDeepAccessibilityData);
            const pool = await getConnectionPool();
            const result = await pool.request()
                .input('ServiceID', sql.Int, service_id)
                .input('OrgID', sql.UniqueIdentifier, org_id)
                .input('parsedSummaryData', sql.NVarChar(sql.MAX), JSON.stringify(parsedSummaryData))
                .input('parsedDeepAccessibileData', sql.NVarChar(sql.MAX), JSON.stringify(parsedDeepAccessibilityData).replace(/\n/g, '\\n'))
                .input('parsedDeepUsabilityData', sql.NVarChar(sql.MAX), JSON.stringify(parsedDeepUsabilityData))
                .execute('InsertFullAccessibilityDataReport');

            return result;
        } catch (error) {
            console.error(`Failed to generate Word document: ${error.message}`);
        }
    } catch (error) {
        console.error(`Error occurred: ${error.message}`);
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