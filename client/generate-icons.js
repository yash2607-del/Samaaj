// Node.js script to generate PWA icons
const fs = require('fs');
const path = require('path');

// For this to work, install: npm install canvas
// If canvas doesn't work, use the generate-icons.html file in browser

const createDirectoryIfNotExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const generateIconsSVG = () => {
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  const iconsDir = path.join(__dirname, 'public', 'icons');
  
  createDirectoryIfNotExists(iconsDir);

  // Create a simple SVG template
  const createSVG = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="#FFB347"/>
  <text x="50%" y="50%" font-size="${size * 0.6}" text-anchor="middle" dominant-baseline="central" fill="#1a1a1a" font-family="Arial, Helvetica, sans-serif" font-weight="bold">S</text>
</svg>`;

  sizes.forEach(size => {
    const svgContent = createSVG(size);
    const filename = `icon-${size}x${size}.svg`;
    fs.writeFileSync(path.join(iconsDir, filename), svgContent);
    console.log(`Generated ${filename}`);
  });

  console.log('\n✅ All SVG icons generated successfully!');
  console.log('📝 Note: For PNG icons, open generate-icons.html in your browser');
  console.log('   Or install "canvas" package and use a canvas-based generator');
};

try {
  generateIconsSVG();
} catch (error) {
  console.error('Error generating icons:', error.message);
  console.log('\n💡 Alternative: Open generate-icons.html in your browser to generate PNG icons');
}
