const express = require('express');
const multer = require('multer');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
 
const upload = multer({ dest: 'uploads/' });
 
const router = express.Router();
router.post('/upload', upload.single('zipfile'), (req, res) => {
    const zipPath = req.file.path;
   
    try {
      const zip = new AdmZip(zipPath);
      const extractPath = path.join(__dirname, 'extracted');
      zip.extractAllTo(extractPath, true);
      fs.unlinkSync(zipPath); // delete temp file
   
      res.send('Zip file extracted successfully.');
    } catch (err) {
      res.status(500).send('Error extracting zip file.');
    }
  });

  module.exports = router;