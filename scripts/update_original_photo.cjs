const cloudinary = require('cloudinary').v2;

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const filePath = process.env.CLOUDINARY_PHOTO_FILE;
const publicId = process.env.CLOUDINARY_PHOTO_PUBLIC_ID || 'ai-product-photography-original-photo';

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error('Missing Cloudinary credentials. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.');
}

if (!filePath) {
  throw new Error('Missing photo file path. Set CLOUDINARY_PHOTO_FILE.');
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

async function uploadPhoto() {
  console.log(`Starting upload of ${filePath}...`);
  try {
    const res = await cloudinary.uploader.upload(filePath, {
      folder: 'reframe/showcase',
      public_id: publicId,
      overwrite: true,
      invalidate: true
    });
    console.log(`Uploaded photo as ${publicId}: ${res.secure_url}`);
  } catch (e) {
    console.error(`Error uploading photo:`, e.message);
  }
}

uploadPhoto();
