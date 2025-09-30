#!/usr/bin/env node

/**
 * Generate Favicon Files with Sharp
 * This script generates high-quality favicon files from the SVG source using Sharp
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

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

async function generateFavicons() {
  try {
    console.log('🎨 Generating favicon files with Sharp...');
    
    // Write the SVG favicon
    fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);
    console.log('✅ Created favicon.svg');
    
    // Create PNG files in different sizes
    const sizes = [
      { size: 16, name: 'favicon-16x16.png' },
      { size: 32, name: 'favicon-32x32.png' },
      { size: 180, name: 'apple-touch-icon.png' },
      { size: 192, name: 'android-chrome-192x192.png' },
      { size: 512, name: 'android-chrome-512x512.png' }
    ];
    
    for (const { size, name } of sizes) {
      await sharp(Buffer.from(svgContent))
        .resize(size, size)
        .png()
        .toFile(path.join(publicDir, name));
      console.log(`✅ Created ${name} (${size}x${size})`);
    }
    
    // Create ICO file (16x16)
    await sharp(Buffer.from(svgContent))
      .resize(16, 16)
      .png()
      .toFile(path.join(publicDir, 'favicon.ico'));
    console.log('✅ Created favicon.ico (16x16)');
    
    // Create Safari pinned tab SVG (monochrome)
    const safariPinnedTabSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
      <!-- Medical cross for Safari pinned tab -->
      <rect x="6" y="2" width="4" height="12" fill="black"/>
      <rect x="2" y="6" width="12" height="4" fill="black"/>
    </svg>`;
    
    fs.writeFileSync(path.join(publicDir, 'safari-pinned-tab.svg'), safariPinnedTabSvg);
    console.log('✅ Created safari-pinned-tab.svg');
    
    console.log('');
    console.log('🎉 All favicon files generated successfully!');
    console.log('📁 Files created in /public directory:');
    console.log('   - favicon.svg (modern SVG favicon)');
    console.log('   - favicon.ico (legacy ICO format)');
    console.log('   - favicon-16x16.png');
    console.log('   - favicon-32x32.png');
    console.log('   - apple-touch-icon.png (180x180)');
    console.log('   - android-chrome-192x192.png (192x192)');
    console.log('   - android-chrome-512x512.png (512x512)');
    console.log('   - safari-pinned-tab.svg (monochrome)');
    console.log('');
    console.log('💡 All PNG files are now high-quality images generated from the SVG source.');
    
  } catch (error) {
    console.error('❌ Error generating favicon files:', error);
    process.exit(1);
  }
}

// Run the generation
generateFavicons();
