const XlsxPopulate = require('xlsx-populate');

class ExcelImageExtractor {
  /**
   * Extract images from Excel file
   */
  async extractImages(fileBuffer) {
    try {
      const workbook = await XlsxPopulate.fromDataAsync(fileBuffer);
      
      // Get the detailed findings sheet (usually sheet 3, index 2)
      if (workbook.sheets().length < 3) {
        console.log('No detailed findings sheet found');
        return [];
      }

      const sheet = workbook.sheet(2); // 0-based index, so 2 = 3rd sheet
      const images = [];

      // Access sheet images
      const sheetImages = sheet._images || [];

      for (let i = 0; i < sheetImages.length; i++) {
        const image = sheetImages[i];
        
        // Get image data
        const imageBuffer = image._imageData;
        
        // Get approximate row number
        const rowNum = this._getImageRowNumber(image);
        
        images.push({
          buffer: imageBuffer,
          rowIndex: rowNum,
          index: i
        });
      }

      console.log(`Extracted ${images.length} images from Excel`);
      return images;
    } catch (error) {
      console.error('Error extracting images:', error);
      return [];
    }
  }

  /**
   * Get approximate row number for an image
   */
  _getImageRowNumber(image) {
    try {
      const from = image._from;
      if (from && from.row !== undefined) {
        return from.row;
      }
      return -1;
    } catch (error) {
      return -1;
    }
  }

  /**
   * Match images to data rows
   */
  matchImagesToRows(images, dataRows, headerRowIndex) {
    return dataRows.map((row, index) => {
      // Calculate actual row number in Excel (accounting for header)
      const excelRowNum = headerRowIndex + 1 + index;
      
      // Find matching image (within 1 row tolerance)
      const matchingImage = images.find(img => 
        Math.abs(img.rowIndex - excelRowNum) <= 1
      );

      return {
        ...row,
        imageData: matchingImage || null
      };
    });
  }
}

module.exports = new ExcelImageExtractor();