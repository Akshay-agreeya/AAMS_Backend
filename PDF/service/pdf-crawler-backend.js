// const puppeteer = require('puppeteer');
// const express = require('express');
// const cors = require('cors');

// const app = express();
// app.use(cors());
// app.use(express.json());

// async function crawlPDFs(url) {
//   const browser = await puppeteer.launch({ headless: true });
//   const page = await browser.newPage();
//   await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

//   // Get all links from <a> tags and filter for PDFs
//   let pdfLinks = await page.evaluate(() => {
//     const anchors = Array.from(document.querySelectorAll('a'));
//     return anchors
//       .map(a => a.href)
//       .filter(href => href && href.toLowerCase().includes('.pdf'));
//   });

//   // Optionally: Crawl iframes for more links
//   const iframeLinks = await page.evaluate(() => {
//     const iframes = Array.from(document.querySelectorAll('iframe'));
//     let found = [];
//     iframes.forEach(iframe => {
//       if (iframe.src && iframe.src.toLowerCase().includes('.pdf')) {
//         found.push(iframe.src);
//       }
//     });
//     return found;
//   });

//   pdfLinks = pdfLinks.concat(iframeLinks);

//   await browser.close();
//   return Array.from(new Set(pdfLinks));
// }

// app.post('/api/crawl-pdfs', async (req, res) => {
//   const { url } = req.body;
//   if (!url) return res.status(400).json({ error: 'URL is required.' });
//   try {
//     const pdfs = await crawlPDFs(url);
//     res.json({ pdfs });
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to crawl website.' });
//   }
// });

// const PORT = 8091;
// app.listen(PORT, () => {
//   console.log(`PDF crawler backend running on port ${PORT}`);
// });
