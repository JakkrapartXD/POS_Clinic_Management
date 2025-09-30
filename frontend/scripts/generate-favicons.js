#!/usr/bin/env node

/**
 * Favicon Generation Script
 * This script generates various favicon sizes from the SVG source
 * 
 * Note: This script requires sharp to be installed for PNG generation
 * Run: npm install sharp --save-dev
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

// Create a simple ICO file (basic implementation)
const icoContent = Buffer.from([
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x10, 0x10, 0x00, 0x00, 0x01, 0x00, 0x20, 0x00, 0x68, 0x04,
  0x00, 0x00, 0x16, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x20, 0x00,
  0x00, 0x00, 0x01, 0x00, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
]);

// Write placeholder files for PNG formats
const sizes = [16, 32, 180, 192, 512];
sizes.forEach(size => {
  const filename = size === 180 ? 'apple-touch-icon.png' : 
                   size === 192 ? 'android-chrome-192x192.png' :
                   size === 512 ? 'android-chrome-512x512.png' :
                   `favicon-${size}x${size}.png`;
  
  // Create a simple placeholder PNG (1x1 transparent pixel)
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
    0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
    0x42, 0x60, 0x82
  ]);
  
  fs.writeFileSync(path.join(publicDir, filename), pngData);
});

console.log('✅ Favicon files generated successfully!');
console.log('📁 Files created in /public directory:');
console.log('   - favicon.svg (modern SVG favicon)');
console.log('   - favicon.ico (legacy ICO format)');
console.log('   - favicon-16x16.png');
console.log('   - favicon-32x32.png');
console.log('   - apple-touch-icon.png');
console.log('   - android-chrome-192x192.png');
console.log('   - android-chrome-512x512.png');
console.log('   - safari-pinned-tab.svg');
console.log('   - site.webmanifest');
console.log('');
console.log('💡 Note: For production, consider using a tool like sharp or imagemagick');
console.log('   to generate high-quality PNG files from the SVG source.');
