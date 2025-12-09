    // Helper to get Last-Modified date from PDF URL
    async function getPdfLastModified(link) {
        try {
            const res = await fetch(link, { method: 'HEAD' });
            const lastModified = res.headers.get('last-modified');
            if (lastModified) {
                return new Date(lastModified).toISOString();
            }
        } catch (e) {
            logs.push(`Failed to get Last-Modified for ${link}: ${e.message}`);
        }
        return null;
    }

    function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
    }
    // Keyword categories for PDF classification
    const pdfCategories = [
        {
            label: "Legal Document",
            keywords: [
                "contract", "agreement", "clause", "law", "legal", "terms", "witness", "notary",
                "patent", "copyright", "federal", "statute", "lawsuit", "indictment", "legislation",
                "regulations", "court", "judge", "attorney", "plaintiff", "defendant", "settlement",
                "litigation", "arbitration", "hearing", "trial", "brief", "motion", "appeal", "verdict",
                "case number", "jurisdiction", "confidentiality", "affidavit", "subpoena", "evidence",
                "testimony", "deposition", "legal opinion", "compliance", "statutory", "ordinance",
                "code", "fines", "penalty", "enforcement", "warrant", "injunction", "liability", "damages",
                "breach", "tort", "intellectual property", "licensing"
            ]
        },
        {
            label: "Festival Document",
            keywords: [
                "festival", "celebration", "event", "guide", "parade", "ceremony", "holiday", "planning",
                "agenda", "music", "arts", "community", "performance", "exhibition", "cultural", "fair",
                "gathering", "program", "schedule", "venue", "ticket", "attendance", "registration",
                "sponsorship", "host", "organizer", "activities", "workshop", "competition", "contest",
                "dance", "theater", "show", "presentation", "launch", "opening", "closing", "festival week",
                "reception", "banquet", "fundraiser", "celebration day", "carnival", "festival guide",
                "volunteer", "committee", "announcement", "promotion", "brochure", "flyer", "poster"
            ]
        },
        {
            label: "Investigation Document",
            keywords: [
                "investigation", "report", "case study", "evidence", "forensic", "audit", "inquiry",
                "inspection", "findings", "analysis", "incident", "review", "assessment", "observation",
                "documentation", "investigator", "evaluation", "audit report", "noncompliance", "violation",
                "risk assessment", "internal control", "regulatory", "probe", "incident report", "inspection report",
                "audit trail", "forensic analysis", "surveillance", "confidential", "security", "risk",
                "breach", "data breach", "cybersecurity", "fraud", "whistleblower", "interview", "statement",
                "inspection record", "corrective action", "remediation", "control testing", "audit findings",
                "evidence review", "case file", "follow-up", "recommendations", "compliance check"
            ]
        },
        {
            label: "Research/Academic Document",
            keywords: [
                "abstract", "introduction", "references", "university", "research", "methodology", "paper",
                "journal", "study", "results", "conclusion", "literature review", "experiment", "data analysis",
                "statistical", "findings", "discussion", "hypothesis", "sampling", "survey", "publication",
                "citation", "bibliography", "appendix", "table of contents", "figure", "graph", "chart",
                "experiment setup", "protocol", "evaluation", "research question", "case study", "observation",
                "analysis", "variables", "significance", "model", "theory", "framework", "conceptual", "outcome",
                "field study", "controlled study", "results discussion", "limitations", "future work", "acknowledgements",
                "funding", "peer-reviewed", "review article", "scientific paper"
            ]
        },
        {
            label: "Financial Document",
            keywords: [
                "balance sheet", "invoice", "transaction", "account", "audit", "financial report", "earnings",
                "quarterly", "board", "shareholder", "revenue", "expense", "profit", "loss", "cash flow",
                "budget", "investment", "portfolio", "dividend", "capital", "asset", "liability", "equity",
                "tax", "statement", "forecast", "financial statement", "statement of accounts", "ledger",
                "journal entry", "accounts payable", "accounts receivable", "audit report", "financial planning",
                "management report", "performance report", "cost analysis", "income statement", "expense report",
                "profit margin", "return on investment", "capital expenditure", "financial analysis", "fiscal year",
                "compliance", "risk management", "valuation", "internal control", "budget allocation", "expense tracking"
            ]
        }
    ];
    // Removed MAX_PDFS limit to allow crawling all PDFs
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const { URL } = require('url');
const fetch = require('node-fetch');
const pdfParse = require('pdf-parse');
const robotsParser = require('robots-parser');

async function checkRobotsTxt(baseUrl) {
    try {
        const robotsUrl = new URL('/robots.txt', baseUrl).href;

        const res = await axios.get(robotsUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
            }
        });

        const robots = robotsParser(robotsUrl, res.data);

        return robots.isAllowed(baseUrl, 'MyBot'); // “MyBot” = crawler name
    } catch (e) {
        return true; // If robots.txt missing → allow crawling
    }
}


async function crawlForPDFs(startUrl, maxDepth = 500, usePuppeteer = true) {
    const visited = new Set();
    const pdfs = new Set();
    const failed = [];
    const logs = [];
    const startDomain = new URL(startUrl).hostname.replace(/^www\./, '');

    // Check robots.txt rules BEFORE crawling
    const allowed = await checkRobotsTxt(startUrl);
    if (!allowed) {
        logs.push(`Blocked by robots.txt: ${startUrl}`);
        console.log(`[PDF Crawler] robots.txt does NOT allow crawling: ${startUrl}`);
        return { pdfs: [], logs };
    }
    console.log(`[PDF Crawler] robots.txt allows crawling: ${startUrl}`);

    console.log(`[PDF Crawler] Starting crawl for: ${startUrl} (maxDepth=${maxDepth})`);

    async function extractLinksWithPuppeteer(url) {
        let browser, page, links = [];
        try {
            browser = await puppeteer.launch({ headless: true, args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled'
            ] });
            page = await browser.newPage();
            await page.setViewport({ width: 1920, height: 1080 });
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            });
        
            // Remove webdriver property
            await page.evaluateOnNewDocument(() => {
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => false,
                });
            });
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
            const res = await axios.get(url, { timeout: 30000, maxRedirects: 5,
                 headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        });
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
        await delay(1000 + Math.random() * 2000);
        
        let links = [];
        let domain = '';
        try {
            domain = new URL(url).hostname.replace(/^www\./, '');
        } catch (e) { return; }

        try {
        if (new URL(url).hash) {
            console.log(`[PDF Crawler] Skipping anchor URL: ${url}`);
            return;
        }
        } catch (e) {
            return;
        }

        // Only crawl subdomains of the start domain
        if (!domain.endsWith(startDomain)) {
            logs.push(`Skipped (outside domain): ${url}`);
            console.log(`[PDF Crawler] Skipped (outside domain): ${url}`);
            return;
        }

    // No PDF limit, crawl all found PDFs

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
            // Stop crawling if 10 PDFs have been found
            // if (pdfs.size >= 10) {
            //     console.log('[PDF Crawler] Reached 10 PDFs, stopping crawl.');
            //     return;
            // }
            let retries = 0;
            while (retries < 3) { // Retry up to 3 times for each link
                try {
                    if (link.endsWith('.pdf')) {
                        pdfs.add(link);
                        console.log(`[PDF Crawler] Found PDF: ${link}`);
                        // Stop crawling if 10 PDFs have been found
                        if (pdfs.size >= 100) {
                            console.log('[PDF Crawler] Reached 100 PDFs, stopping crawl.');
                            return;
                        }
                    } else if (link.startsWith('http') && !visited.has(link)) {
                        await crawl(link, depth + 1);
                        // Stop crawling if 10 PDFs have been found after recursion
                        // if (pdfs.size >= 10) {
                        //     return;
                        // }
                    }
                    break; // Success, exit retry loop
                } catch (e) {
                    retries++;
                    if (retries === 3) {
                        logs.push(`Failed to process link after 3 retries: ${link}`);
                        console.log(`[PDF Crawler] Failed to process link after 3 retries: ${link}`);
                    }
                }
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

    // Categorize PDF strictly by keyword lists
    function categorizePdf(text) {
        const lower = text.toLowerCase();
        for (const cat of pdfCategories) {
            for (const kw of cat.keywords) {
                if (lower.includes(kw.toLowerCase())) {
                    return cat.label;
                }
            }
        }
        return 'Uncategorized';
    }

    // Map only the first 10 PDF URLs to objects with name, link, pages, and category
    const pdfObjects = [];
    const firstTenPdfs = Array.from(pdfs);
    for (const link of firstTenPdfs) {
        const name = link.split('/').pop() || link;
        let pages = await getPdfPageCount(link);
        let text = await getPdfText(link);
        let category = categorizePdf(text);
        let lastModified = await getPdfLastModified(link);
        pdfObjects.push({ name, link, pages, category, lastModified });
    }
    return { pdfs: pdfObjects, logs };
}

module.exports = { crawlForPDFs };