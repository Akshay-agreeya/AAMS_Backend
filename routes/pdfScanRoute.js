const express = require('express');
const router = express.Router();
const { generatePdfScanController } = require('../controllers/pdfScanController');

router.post('/scan-pdfs', generatePdfScanController);

module.exports = router;
