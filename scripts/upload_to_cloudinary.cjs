const cloudinary = require('cloudinary').v2;
const path = require('path');

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const sourceDir = process.env.CLOUDINARY_SOURCE_DIR;

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error('Missing Cloudinary credentials. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.');
}

if (!sourceDir) {
  throw new Error('Missing source directory. Set CLOUDINARY_SOURCE_DIR to the folder containing upload files.');
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

const files = [
  { name: 'WhatsApp Image 2026-03-28 at 5.15.13 PM.jpeg', publicId: 'ai-gen-1' },
  { name: 'WhatsApp Image 2026-03-28 at 5.15.20 PM (1).jpeg', publicId: 'ai-gen-2' },
  { name: 'WhatsApp Image 2026-03-28 at 5.15.20 PM (2).jpeg', publicId: 'ai-gen-3' },
  { name: 'WhatsApp Image 2026-03-28 at 5.15.20 PM (3).jpeg', publicId: 'ai-gen-4' },
  { name: 'WhatsApp Image 2026-03-28 at 5.15.20 PM.jpeg', publicId: 'ai-gen-5' }
];

async function uploadFiles() {
  for (const file of files) {
    const filePath = path.join(sourceDir, file.name);
    try {
      const res = await cloudinary.uploader.upload(filePath, {
        folder: 'reframe/showcase',
        public_id: file.publicId,
        use_filename: false,
        unique_filename: false,
        overwrite: true
      });
      console.log(`Uploaded ${file.name} as ${file.publicId}: ${res.secure_url}`);
    } catch (e) {
      console.error(`Error uploading ${file.name}:`, e.message);
    }
  }
}

uploadFiles();
