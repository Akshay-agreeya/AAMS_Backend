const express = require('express');
const router = express.Router();
const { generatePdfScanController, getPdfScanController } = require('../controllers/pdfScanController');

router.post('/scan-pdfs', generatePdfScanController);
router.get('/scan-pdfs/:scan_id', getPdfScanController);


module.exports = router;
