const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");

async function extractImagesFromExcel(filePath, assessmentId) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const imageDir = path.join(
    __dirname,
    "../uploads/screenshots",
    String(assessmentId)
  );

  if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
  }

  const savedImages = [];

  workbook.eachSheet((worksheet) => {
    worksheet.getImages().forEach((img, index) => {
      const image = workbook.model.media.find(m => m.index === img.imageId);

      const ext = image.extension;
      const filename = `img_${Date.now()}_${index}.${ext}`;
      const filepath = path.join(imageDir, filename);

      fs.writeFileSync(filepath, image.buffer);

      savedImages.push({
        sheet: worksheet.name,
        row: img.range.tl.row,
        col: img.range.tl.col,
        path: `/uploads/screenshots/${assessmentId}/${filename}`
      });
    });
  });

  return savedImages;
}

module.exports = {
  extractImagesFromExcel
};
