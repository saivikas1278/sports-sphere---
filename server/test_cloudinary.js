import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

async function testUpload() {
  try {
    const result = await cloudinary.uploader.upload('https://cloudinary-devs.github.io/cld-docs-assets/assets/images/butterfly.jpeg', {
      folder: 'test_folder',
    });
    console.log('Upload success:', result);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}

testUpload();
