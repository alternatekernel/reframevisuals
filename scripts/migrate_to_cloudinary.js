const fs = require('fs');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: 'dnmj4altq',
  api_key: '246224826751964',
  api_secret: 'ZkOf11VgvmMKTlgrJrvWal8ovns',
});

const PUBLIC_DIR = path.join(__dirname, '../frontend/public');
const SRC_DATA_DIR = path.join(__dirname, '../frontend/src/data');

const filesToReplace = [
  path.join(__dirname, '../frontend/index.html'),
  path.join(SRC_DATA_DIR, 'testimonials.ts'),
  path.join(SRC_DATA_DIR, 'insightsData.ts'),
  path.join(SRC_DATA_DIR, 'blogPosts.ts'),
  path.join(SRC_DATA_DIR, 'services.ts'),
  path.join(SRC_DATA_DIR, 'expansionPages.ts')
];

function getAllImages(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllImages(filePath, fileList);
    } else {
      if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(filePath)) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

async function uploadAndReplace() {
  const images = getAllImages(path.join(PUBLIC_DIR, 'images'));
  if (fs.existsSync(path.join(PUBLIC_DIR, 'og-image.png'))) {
    images.push(path.join(PUBLIC_DIR, 'og-image.png'));
  }

  const replacements = [];

  for (const imgPath of images) {
    const relativeToPublic = imgPath.replace(PUBLIC_DIR, '').replace(/\\/g, '/');
    const folder = relativeToPublic.split('/').slice(0, -1).join('/').replace(/^\//, 'reframe') || 'reframe';
    const publicId = path.basename(imgPath, path.extname(imgPath));

    console.log(`Uploading ${relativeToPublic} to folder ${folder} ...`);

    try {
      const result = await cloudinary.uploader.upload(imgPath, {
        folder: folder,
        public_id: publicId,
        overwrite: true,
        quality: 'auto:best',
      });

      console.log(` -> Success: ${result.secure_url}`);
      replacements.push({
        oldPath: relativeToPublic,
        newUrl: result.secure_url
      });
    } catch (err) {
      console.error(` -> Failed to upload ${relativeToPublic}:`, err.message);
    }
  }

  console.log('Writing replacements...');
  
  for (const file of filesToReplace) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    for (const r of replacements) {
      // Replace "/images/..." with Cloudinary URL
      // Account for trailing slash or not
      let searchPath = r.oldPath;
      if (searchPath.startsWith('/')) {
         // Also match without leading slash in case it's relative
         const regex = new RegExp(`['"]${searchPath}['"]|\\(${searchPath}\\)|['"]${searchPath.slice(1)}['"]|\\(${searchPath.slice(1)}\\)`, 'g');
         if (regex.test(content)) {
           content = content.replace(regex, (match) => {
             if (match.startsWith('(')) return `(${r.newUrl})`;
             if (match.startsWith("'")) return `'${r.newUrl}'`;
             if (match.startsWith('"')) return `"${r.newUrl}"`;
             return match;
           });
           modified = true;
         }
      }
    }

    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Modified ${file}`);
    }
  }

  // Also write replacements to a temp file so we can delete them later
  fs.writeFileSync(path.join(__dirname, 'uploaded_images.json'), JSON.stringify(images, null, 2));

  console.log('Done.');
}

uploadAndReplace().catch(console.error);
