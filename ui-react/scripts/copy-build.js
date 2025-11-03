/**
 * Copy build files to Flask static folder
 * 
 * Note: Flask serves directly from ui-react/dist/, so this script
 * is optional. It's kept for compatibility with deployment scripts
 * that might need to copy to a different location.
 * 
 * For most cases, you can just run: npm run build
 * Flask will automatically serve from ui-react/dist/
 */

const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '..', 'dist');

// Verify build exists
if (fs.existsSync(buildDir)) {
  console.log('✅ Build directory exists at:', buildDir);
  console.log('📝 Flask will serve directly from this location.');
  console.log('💡 No copying needed - Flask is configured to serve from ui-react/dist/');
} else {
  console.error('❌ Build directory not found. Run "npm run build" first.');
  process.exit(1);
}

