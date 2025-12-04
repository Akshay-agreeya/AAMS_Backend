const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.includes("excel") || file.mimetype.includes("spreadsheet")) {
        cb(null, true);
    } else {
        cb(new Error("Only Excel files allowed (.xlsx)"), false);
    }
};

module.exports = multer({ storage, fileFilter });
