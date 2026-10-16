const path = require('path');
const fs = require('fs');

// Ensure NODE_ENV is set to production if not specified
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Harden production runtime logging: keep warnings/errors, silence noisy info/debug logs.
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
}

// Import the backend app
// Path: root/backend/dist/index.js
const backendPath = path.join(__dirname, 'backend/dist/index.js');

if (!fs.existsSync(backendPath)) {
  console.error('❌ Backend build not found! Run "npm run build" first.');
  process.exit(1);
}

console.log('🚀 Starting Reframe Platform Unified Server...');
require(backendPath);
