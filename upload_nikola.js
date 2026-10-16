const https = require('https');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CLOUD_NAME = 'dnmj4altq';
const API_KEY = '246224826751964';
const API_SECRET = 'ZkOf11VgvmMKTlgrJrvWal8ovns';

function generateSignature(params, apiSecret) {
  const sorted = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');
  return crypto.createHash('sha1').update(sorted + apiSecret).digest('hex');
}

async function uploadToCloudinary(imagePath) {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'reframe/testimonials';
  const publicId = 'nikola_filic_portrait';

  const params = {
    folder,
    public_id: publicId,
    timestamp,
    overwrite: 'true',
    quality: 'auto:best',
  };

  const signature = generateSignature(params, API_SECRET);

  const FormData = require('form-data');
  const form = new FormData();
  form.append('file', fs.createReadStream(imagePath));
  form.append('api_key', API_KEY);
  form.append('timestamp', timestamp.toString());
  form.append('signature', signature);
  form.append('folder', folder);
  form.append('public_id', publicId);
  form.append('overwrite', 'true');
  form.append('quality', 'auto:best');

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${CLOUD_NAME}/image/upload`,
      method: 'POST',
      headers: form.getHeaders(),
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.error) {
            reject(new Error(result.error.message));
          } else {
            resolve(result);
          }
        } catch (e) {
          reject(new Error('Failed to parse response: ' + data));
        }
      });
    });

    req.on('error', reject);
    form.pipe(req);
  });
}

// Check if form-data is available, install if not
try {
  require('form-data');
} catch (e) {
  console.log('Installing form-data...');
  execSync('npm install form-data', { stdio: 'inherit' });
}

const imagePath = process.argv[2];
if (!imagePath) {
  console.error('Usage: node upload_nikola.js <image_path>');
  process.exit(1);
}

if (!fs.existsSync(imagePath)) {
  console.error('Image not found:', imagePath);
  process.exit(1);
}

console.log('Uploading', imagePath, 'to Cloudinary...');
uploadToCloudinary(imagePath)
  .then(result => {
    console.log('SUCCESS!');
    console.log('Secure URL:', result.secure_url);
    console.log('Public ID:', result.public_id);
    console.log('Format:', result.format);
    console.log('Dimensions:', result.width, 'x', result.height);
    
    // Write result to file for easy reading
    fs.writeFileSync('cloudinary_upload_result.json', JSON.stringify(result, null, 2));
    console.log('\nFull result saved to cloudinary_upload_result.json');
  })
  .catch(err => {
    console.error('UPLOAD FAILED:', err.message);
    process.exit(1);
  });
