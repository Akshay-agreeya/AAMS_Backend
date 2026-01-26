const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');

class ImageService {
  constructor() {
    // Create uploads directory if it doesn't exist
    this.uploadsDir = path.join(__dirname, '../../uploads/screenshots');
    fs.ensureDirSync(this.uploadsDir);
  }

  /**
   * Save image buffer to file system
   */
  async saveImage(imageBuffer, filename) {
    try {
      const timestamp = Date.now();
      const sanitizedFilename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const imageName = `${timestamp}_${sanitizedFilename}.png`;
      const imagePath = path.join(this.uploadsDir, imageName);

      // Convert and optimize image
      await sharp(imageBuffer)
        .png({ quality: 80 })
        .resize(1200, null, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .toFile(imagePath);

      // Return relative path
      return `/uploads/screenshots/${imageName}`;
    } catch (error) {
      console.error('Error saving image:', error);
      return null;
    }
  }

  /**
   * Delete image from file system
   */
  async deleteImage(imagePath) {
    try {
      const fullPath = path.join(__dirname, '../..', imagePath);
      if (await fs.pathExists(fullPath)) {
        await fs.remove(fullPath);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }
}

module.exports = new ImageService();