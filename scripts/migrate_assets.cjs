const cloudinary = require('cloudinary').v2;

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const sourceCloud = process.env.CLOUDINARY_SOURCE_CLOUD || 'dwrphivxc';

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error('Missing Cloudinary credentials. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.');
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

const files = [
  'background-removal-before',
  'background-removal-after',
  'clipping-path-before',
  'clipping-path-after',
  'multi-clipping-path-before',
  'multi-clipping-path-after',
  'color-correction-before',
  'color-correction-after',
  'color-change-before',
  'color-change-after',
  'color-change-2-before',
  'color-change-2-after',
  'shadow-creation-before',
  'shadow-creation-after',
  'manipulation-before',
  'manipulation-after',
  'pattern-change-before',
  'pattern-change-after',
  'pattern-change-2-before',
  'pattern-change-2-after',
  'retouching-before',
  'retouching-after',
  'jewelry-retouch-before',
  'jewelry-retouch-after',
  'garment-retouch-before',
  'garment-retouch-after',
  'model-retouch-before',
  'model-retouch-after',
  'ghost-mannequin-before',
  'ghost-mannequin-after'
];

async function migrate() {
  let success = 0;
  for (const file of files) {
    const oldUrl = `https://res.cloudinary.com/${sourceCloud}/image/upload/reframe/services/${file}.jpg`;
    
    try {
      console.log(`Migrating ${file}...`);
      const res = await cloudinary.uploader.upload(oldUrl, {
        folder: 'reframe/services',
        public_id: file,
        overwrite: true
      });
      success++;
    } catch (e) {
      console.error(`Failed to migrate ${file}:`, e.message || e);
    }
  }
  console.log(`Migration complete. Successfully migrated ${success} out of ${files.length} images.`);
}

migrate();
