
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const { URL } = require('url');

async function crawlForPDFs(startUrl, maxDepth = 2, usePuppeteer = true) {
    const visited = new Set();
    const pdfs = new Set();
    const failed = [];
    const logs = [];
    const startDomain = new URL(startUrl).hostname.replace(/^www\./, '');
    console.log(`[PDF Crawler] Starting crawl for: ${startUrl} (maxDepth=${maxDepth})`);

    async function extractLinksWithPuppeteer(url) {
        let browser, page, links = [];
        try {
            browser = await puppeteer.launch({ headless: true });
            page = await browser.newPage();
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
            links = await page.$$eval('a[href]', anchors => anchors.map(a => a.href));
            console.log(`[PDF Crawler] Puppeteer extracted ${links.length} links from ${url}`);
        } catch (err) {
            logs.push(`Puppeteer failed for ${url}: ${err.message}`);
            console.log(`[PDF Crawler] Puppeteer failed for ${url}: ${err.message}`);
        } finally {
            if (browser) await browser.close();
        }
        return links;
    }

    async function extractLinksWithCheerio(url) {
        let links = [];
        try {
            const res = await axios.get(url, { timeout: 10000, maxRedirects: 5 });
            const $ = cheerio.load(res.data);
            $('a[href]').each((_, el) => {
                let href = $(el).attr('href');
                if (href) links.push(new URL(href, url).href);
            });
            console.log(`[PDF Crawler] Cheerio extracted ${links.length} links from ${url}`);
        } catch (err) {
            logs.push(`Cheerio failed for ${url}: ${err.message}`);
            console.log(`[PDF Crawler] Cheerio failed for ${url}: ${err.message}`);
        }
        return links;
    }

    async function crawl(url, depth) {
        if (visited.has(url) || depth > maxDepth) return;
        visited.add(url);
        let links = [];
        let domain = '';
        try {
            domain = new URL(url).hostname.replace(/^www\./, '');
        } catch (e) { return; }

        // Only crawl subdomains of the start domain
        if (!domain.endsWith(startDomain)) {
            logs.push(`Skipped (outside domain): ${url}`);
            console.log(`[PDF Crawler] Skipped (outside domain): ${url}`);
            return;
        }

        console.log(`[PDF Crawler] Crawling [depth ${depth}]: ${url}`);

        // Use Puppeteer for JS-heavy sites, fallback to Cheerio
        if (usePuppeteer) {
            links = await extractLinksWithPuppeteer(url);
            if (!links.length) {
                links = await extractLinksWithCheerio(url);
            }
        } else {
            links = await extractLinksWithCheerio(url);
        }

        for (const link of links) {
            try {
                if (link.endsWith('.pdf')) {
                    pdfs.add(link);
                    console.log(`[PDF Crawler] Found PDF: ${link}`);
                } else if (link.startsWith('http') && !visited.has(link)) {
                    await crawl(link, depth + 1);
                }
            } catch (e) {
                logs.push(`Failed to process link: ${link}`);
                console.log(`[PDF Crawler] Failed to process link: ${link}`);
            }
        }
    }

    try {
        await crawl(startUrl, 0);
    } catch (err) {
        logs.push(`Top-level crawl failed: ${err.message}`);
        console.log(`[PDF Crawler] Top-level crawl failed: ${err.message}`);
    }
    console.log(`[PDF Crawler] Crawl finished. Found ${pdfs.size} PDFs.`);
    return { pdfs: Array.from(pdfs), logs };
}

module.exports = { crawlForPDFs };