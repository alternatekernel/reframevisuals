import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'dnmj4altq',
  api_key: '246224826751964',
  api_secret: 'ZkOf11VgvmMKTlgrJrvWal8ovns',
});

const filePath = 'C:\\Users\\Shovon Ahmed\\.gemini\\antigravity\\brain\\c938c7df-770c-4eae-8771-ce0dca280676\\media__1781715707163.png';

cloudinary.uploader.upload(filePath, {
  folder: 'reframe/testimonials',
  public_id: 'nikola_filic_profile',
  overwrite: true,
})
.then(result => console.log('UPLOAD_SUCCESS', result.secure_url))
.catch(error => console.error('UPLOAD_ERROR', error));
