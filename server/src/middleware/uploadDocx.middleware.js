const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const docxStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tamilarasu_invoices',
    resource_type: 'raw',
    format: 'docx'
  }
});

const docxFileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.originalname.endsWith('.docx')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Not a DOCX file! Please upload a valid Word document (.docx).'), false);
  }
};

const uploadDocx = multer({
  storage: docxStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: docxFileFilter
});

module.exports = uploadDocx;
