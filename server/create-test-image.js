#!/usr/bin/env node

/**
 * Create a small test image for template testing
 */

const fs = require('fs');
const path = require('path');

// Create a simple PNG image (1x1 transparent pixel)
const pngData = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk header
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
  0x08, 0x04, 0x00, 0x00, 0x00, 0xB5, 0x1C, 0x0C, // bit depth 8, grayscale+alpha
  0x02, 0x00, 0x00, 0x00, 0x0B, 0x49, 0x44, 0x41, // IDAT chunk header
  0x54, 0x78, 0x9C, 0x62, 0x00, 0x00, 0x00, 0x02, // compressed data
  0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33, 0x00, 0x00, // checksum
  0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, // IEND chunk
  0x60, 0x82
]);

const imagePath = path.join(__dirname, 'test-images', 'test-template.png');

// Create directory if it doesn't exist
const dir = path.dirname(imagePath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Write the image
fs.writeFileSync(imagePath, pngData);

console.log(`✅ Test image created at: ${imagePath}`);
console.log(`📊 Image size: ${pngData.length} bytes`);

// Verify the file was created
if (fs.existsSync(imagePath)) {
  const stats = fs.statSync(imagePath);
  console.log(`📁 File size on disk: ${stats.size} bytes`);
} else {
  console.error('❌ Failed to create test image');
}