#!/usr/bin/env node

/**
 * Create Favicon Files Script
 * This script creates proper favicon files from the SVG source
 */

const fs = require('fs');
const path = require('path');

// SVG content for the favicon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="16" cy="16" r="15" fill="url(#grad1)" stroke="#047857" stroke-width="1"/>
  
  <!-- Medical cross -->
  <rect x="14" y="8" width="4" height="16" fill="white" rx="1"/>
  <rect x="8" y="14" width="16" height="4" fill="white" rx="1"/>
  
  <!-- Small accent dots -->
  <circle cx="8" cy="8" r="1.5" fill="white" opacity="0.7"/>
  <circle cx="24" cy="8" r="1.5" fill="white" opacity="0.7"/>
  <circle cx="8" cy="24" r="1.5" fill="white" opacity="0.7"/>
  <circle cx="24" cy="24" r="1.5" fill="white" opacity="0.7"/>
</svg>`;

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write the SVG favicon
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);

// Create a simple 16x16 ICO file (basic implementation)
const createIcoFile = () => {
  // ICO file header
  const icoHeader = Buffer.from([
    0x00, 0x00, // Reserved
    0x01, 0x00, // Type (1 = ICO)
    0x01, 0x00, // Number of images
    0x10,       // Width (16)
    0x10,       // Height (16)
    0x00,       // Color palette (0 = no palette)
    0x00,       // Reserved
    0x01, 0x00, // Color planes
    0x20, 0x00, // Bits per pixel (32)
    0x00, 0x01, 0x00, 0x00, // Image data size (256 bytes)
    0x16, 0x00, 0x00, 0x00  // Image data offset (22 bytes)
  ]);
  
  // Create a simple 16x16 RGBA image data (teal background with white cross)
  const imageData = Buffer.alloc(1024); // 16x16x4 bytes
  
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const offset = (y * 16 + x) * 4;
      
      // Check if we're in the cross area
      const inCross = (x >= 7 && x <= 8 && y >= 4 && y <= 11) || 
                     (x >= 4 && x <= 11 && y >= 7 && y <= 8);
      
      if (inCross) {
        // White cross
        imageData[offset] = 255;     // Blue
        imageData[offset + 1] = 255; // Green
        imageData[offset + 2] = 255; // Red
        imageData[offset + 3] = 255; // Alpha
      } else {
        // Teal background
        imageData[offset] = 129;     // Blue
        imageData[offset + 1] = 150; // Green
        imageData[offset + 2] = 16;  // Red
        imageData[offset + 3] = 255; // Alpha
      }
    }
  }
  
  return Buffer.concat([icoHeader, imageData]);
};

// Create a simple PNG file (1x1 transparent pixel)
const createSimplePng = () => {
  return Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // Width: 1
    0x00, 0x00, 0x00, 0x01, // Height: 1
    0x08, 0x06, 0x00, 0x00, 0x00, // Bit depth, color type, compression, filter, interlace
    0x1F, 0x15, 0xC4, 0x89, // CRC
    0x00, 0x00, 0x00, 0x0A, // IDAT chunk length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, // Compressed data
    0x0D, 0x0A, 0x2D, 0xB4, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
};

// Create favicon files
try {
  // Create ICO file
  const icoData = createIcoFile();
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoData);
  
  // Create PNG files (using simple 1x1 transparent for now)
  const pngData = createSimplePng();
  const sizes = [16, 32, 180, 192, 512];
  
  sizes.forEach(size => {
    const filename = size === 180 ? 'apple-touch-icon.png' : 
                     size === 192 ? 'android-chrome-192x192.png' :
                     size === 512 ? 'android-chrome-512x512.png' :
                     `favicon-${size}x${size}.png`;
    
    fs.writeFileSync(path.join(publicDir, filename), pngData);
  });
  
  console.log('✅ Favicon files created successfully!');
  console.log('📁 Files created in /public directory:');
  console.log('   - favicon.svg (modern SVG favicon)');
  console.log('   - favicon.ico (legacy ICO format)');
  console.log('   - favicon-16x16.png');
  console.log('   - favicon-32x32.png');
  console.log('   - apple-touch-icon.png');
  console.log('   - android-chrome-192x192.png');
  console.log('   - android-chrome-512x512.png');
  console.log('');
  console.log('💡 Note: The PNG files are currently 1x1 transparent placeholders.');
  console.log('   For production, consider using a tool like sharp or imagemagick');
  console.log('   to generate high-quality PNG files from the SVG source.');
  
} catch (error) {
  console.error('❌ Error creating favicon files:', error);
  process.exit(1);
}
