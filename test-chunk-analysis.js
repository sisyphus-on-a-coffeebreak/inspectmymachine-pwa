// Quick script to analyze what's in vendor-misc
const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'dist', 'assets', 'js', 'vendor');
const files = fs.readdirSync(distPath);

files.forEach(file => {
  if (file.includes('vendor-misc')) {
    const filePath = path.join(distPath, file);
    const stats = fs.statSync(filePath);
    console.log(`\n${file}: ${(stats.size / 1024).toFixed(2)} KB`);
    // Try to read first few KB to see what's in there
    const content = fs.readFileSync(filePath, 'utf8').substring(0, 5000);
    // Look for React-related strings
    if (content.includes('forwardRef') || content.includes('react') || content.includes('React')) {
      console.log('⚠️  Contains React-related code!');
      // Find the module name
      const reactMatch = content.match(/node_modules[^"']*react[^"']*/);
      if (reactMatch) {
        console.log('Found:', reactMatch[0]);
      }
    }
  }
});
