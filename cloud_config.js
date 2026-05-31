const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary-v2');
const multer = require('multer');

// Configure Cloudinary using .env variables (ensure they exist)
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

// Set up Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'wanderlust',
    allowed_formats: ['png', 'jpg', 'jpeg']
  }
});

module.exports = { cloudinary, storage };
