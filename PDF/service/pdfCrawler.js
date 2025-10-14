    const MAX_PDFS = 10; // Restrict to 10 PDFs
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const { URL } = require('url');
const fetch = require('node-fetch');
const pdfParse = require('pdf-parse');

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
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 }); // Increased timeout to 60 seconds
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
            const res = await axios.get(url, { timeout: 30000, maxRedirects: 5 }); 
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

        // Stop crawling if we've reached the max PDF limit
        if (pdfs.size >= MAX_PDFS) return;

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
            if (pdfs.size >= MAX_PDFS) break; // Stop if max reached
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
    // Helper to get page count from a PDF URL
    async function getPdfPageCount(link) {
        try {
            const res = await fetch(link);
            if (!res.ok) return null;
            const buffer = await res.buffer();
            const data = await pdfParse(buffer);
            return data.numpages || null;
        } catch (e) {
            logs.push(`Failed to get page count for ${link}: ${e.message}`);
            return null;
        }
    }

    // Helper to get PDF text content
    async function getPdfText(link) {
        try {
            const res = await fetch(link);
            if (!res.ok) return '';
            const buffer = await res.buffer();
            const data = await pdfParse(buffer);
            return data.text || '';
        } catch (e) {
            logs.push(`Failed to get text for ${link}: ${e.message}`);
            return '';
        }
    }

    // Helper to check if PDF is at least two years old (by filename with date or last modified header)
    async function isTwoYearsOld(link) {
        // Try to extract year from filename (e.g., ...2021..., ...2022...)
        const name = link.split('/').pop() || link;
        const yearMatch = name.match(/(20\d{2})/);
        if (yearMatch) {
            const year = parseInt(yearMatch[1], 10);
            if (year <= new Date().getFullYear() - 2) return true;
        }
        // Try to get last-modified header
        try {
            const res = await fetch(link, { method: 'HEAD' });
            const lastModified = res.headers.get('last-modified');
            if (lastModified) {
                const date = new Date(lastModified);
                if (date < new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000)) return true;
            }
        } catch (e) {}
        return false;
    }

    // Categorize PDF based on content and age
    function categorizePdf(text, isOld) {
        const lower = text.toLowerCase();
        if (isOld) return 'Two Years Old';
        if (/congratulat|festival|wish(es)?|greetings/.test(lower)) return 'Congratulatory/Festive';
        if (/government|circular|notice|guideline/.test(lower)) return 'Government Notice';
        return 'Uncategorized';
    }

    // Map PDF URLs to objects with name, link, pages, and category
    const pdfObjects = [];
    for (const link of pdfs) {
        const name = link.split('/').pop() || link;
        let pages = null;
        pages = await getPdfPageCount(link);
        let text = await getPdfText(link);
        let isOld = await isTwoYearsOld(link);
        let category = categorizePdf(text, isOld);
        pdfObjects.push({ name, link, pages, category });
    }
    return { pdfs: pdfObjects, logs };
}

module.exports = { crawlForPDFs };