const express = require('express');
const router = express.Router();
const { crawlForPDFs } = require('./../service/pdfCrawler');

router.post('/crawl-pdfs', async (req, res) => {
    const { url, maxDepth } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required.' });

    try {
        // Default maxDepth to 2 if not provided
        const depth = typeof maxDepth === 'number' ? maxDepth : 2;
        const result = await crawlForPDFs(url, depth, true);
        res.json({ pdfs: result.pdfs, logs: result.logs });
    } catch (err) {
        res.status(500).json({ error: 'Failed to crawl website.' });
    }
});

module.exports = router;