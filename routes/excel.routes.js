const express = require("express");
const router = express.Router();

const uploadExcel = require("../middlewares/uploadExcel");
const { uploadA11yExcel } = require("../controllers/excel.controller");

router.post("/upload-excel", uploadExcel.single("file"), uploadA11yExcel);

module.exports = router;



