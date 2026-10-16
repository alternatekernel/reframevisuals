const cloudinary = require('cloudinary').v2;
const path = require('path');

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const filePath = process.env.CLOUDINARY_VIDEO_FILE;
const publicId = process.env.CLOUDINARY_VIDEO_PUBLIC_ID || 'ai-product-video';

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error('Missing Cloudinary credentials. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.');
}

if (!filePath) {
  throw new Error('Missing video file path. Set CLOUDINARY_VIDEO_FILE.');
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

async function uploadVideo() {
  console.log(`Starting upload of ${filePath}...`);
  try {
    const res = await cloudinary.uploader.upload(filePath, {
      resource_type: 'video',
      folder: 'reframe/showcase',
      public_id: publicId,
      overwrite: true,
      // Apply eco-compression during upload processing
      transformation: [
        { quality: 'auto:eco', fetch_format: 'auto' }
      ]
    });
    console.log(`Uploaded video as ${publicId}: ${res.secure_url}`);
  } catch (e) {
    console.error(`Error uploading video:`, e.message);
  }
}

uploadVideo();
