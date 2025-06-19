const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const parseSummaryReport = require('../utils/parseSortSiteSummaryReport'); // Assuming function is exported
const parseDeepAccessibilityReport = require('../utils/parseSortSiteDeepAccessibilityReport');
const parseDeepUsabilityReport = require('../utils/parseSortSiteDeepUsabilityReport')
const { getConnectionPool, sql } = require('../config/db');
const parseDeepSEOReport = require('../utils/parseSortSiteDeepSearchUsabilityReport');
const parseDeepStandardReport = require('../utils/parseSortSiteDeepStandardReport');


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

async function navigateToReportAndBack(summaryFrame, page, linkHref, parserFn, label) {
    if (!linkHref) {
        console.warn(`${label} link not found in summary.`);
        return [];
    }

    const link = await summaryFrame.$(`a[href="${linkHref}"]`);
    if (!link) {
        console.warn(`${label} link not clickable.`);
        return [];
    }

    await link.click();
    console.log(`Navigated to deep ${label.toLowerCase()} report: ${linkHref}`);
    await new Promise(r => setTimeout(r, 10000));

    const deepFrameHandle = await page.$('iframe.embedFrame');
    const deepFrame = await deepFrameHandle.contentFrame();
    const deepHTML = await deepFrame.content();

    const parsedData = parserFn(deepHTML);
    console.log(`Deep ${label.toLowerCase()} report parsed.`);

    const backToSummary = await summaryFrame.$('a[href="map.htm"]');
    if (backToSummary) {
        await backToSummary.click();
        console.log('Navigated back to Summary.');
        await new Promise(r => setTimeout(r, 10000));
    } else {
        console.warn('Summary link (map.htm) not found in iframe.');
    }

    return parsedData;
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
        console.log(parsedSummaryData);
        console.log("Summary report parsed.");


        const $ = cheerio.load(summaryHTML);
        const accLinkHref = $('a[href="map.ACC.htm"]').attr('href');
        const useLinkHref = $('a[href="map.USE.htm"]').attr('href');
        const seoLinkHref = $('a[href="map.SEO.htm"]').attr('href');
        const standardLinkHref = $('a[href="map.W3C.htm"]').attr('href');

        const parsedDeepAccessibilityData = parsedSummaryData[0].data.some(item =>
            item.Category === "Accessibility" && item.Pages.trim().startsWith("0 pages")
        )
            ? [
                {
                    header: "Deep Accessibility Report",
                    data: [],
                    reportType: "Deep"
                }
            ]
            :
            await navigateToReportAndBack(
                summaryFrame,
                page,
                accLinkHref,
                parseDeepAccessibilityReport,
                "Accessibility"
            );

        const parsedDeepUsabilityData = parsedSummaryData[0].data.some(item =>
            item.Category === "Usability" && item.Pages.trim().startsWith("0 pages")
        )
            ? [
                {
                    header: "Deep Usability Report",
                    data: [],
                    reportType: "Deep"
                }
            ]
            : await navigateToReportAndBack(
                summaryFrame,
                page,
                useLinkHref,
                parseDeepUsabilityReport,
                "Usability"
            );

        const parsedDeepSEOData = parsedSummaryData[0].data.some(item =>
            item.Category === "Search" && item.Pages.trim().startsWith("0 pages")
        )
            ? [
                {
                    header: "Deep Seo Report",
                    data: [],
                    reportType: "Deep"
                }
            ]
            : await navigateToReportAndBack(
                summaryFrame,
                page,
                seoLinkHref,
                parseDeepSEOReport,
                "SEO"
            );



        const parsedDeepStandardData = parsedSummaryData[0].data.some(item =>
            item.Category === "Standards" && item.Pages.trim().startsWith("0 pages")
        )
            ? [
                {
                    header: "Deep Standards Report",
                    data: [],
                    reportType: "Deep"
                }
            ]
            :await navigateToReportAndBack(
            summaryFrame,
            page,
            standardLinkHref,
            parseDeepStandardReport,
            "Standards"
        );

        try {
            const pool = await getConnectionPool();
            const result = await pool.request()
                .input('ServiceID', sql.Int, service_id)
                .input('OrgID', sql.UniqueIdentifier, org_id)
                .input('parsedSummaryData', sql.NVarChar(sql.MAX), JSON.stringify(parsedSummaryData))
                .input('parsedDeepAccessibileData', sql.NVarChar(sql.MAX), JSON.stringify(parsedDeepAccessibilityData).replace(/\n/g, '\\n'))
                .input('parsedDeepUsabilityData', sql.NVarChar(sql.MAX), JSON.stringify(parsedDeepUsabilityData))
                .input('parsedDeepSEOData', sql.NVarChar(sql.MAX), JSON.stringify(parsedDeepSEOData))
                .input('parsedDeepStandardData', sql.NVarChar(sql.MAX), JSON.stringify(parsedDeepStandardData))
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