const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload folder if it doesn't exist
const uploadDir = path.join(__dirname, '../../', process.env.UPLOAD_PATH || 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create a subfolder for drone images organized by constructionSite ID
    const siteId = req.params.siteId || 'unsorted';

    console.log("unsorted", siteId, req.body)
    const sitePath = path.join(uploadDir, siteId.toString());
    
    if (!fs.existsSync(sitePath)) {
      fs.mkdirSync(sitePath, { recursive: true });
    }
    
    cb(null, sitePath);
  },
  filename: function (req, file, cb) {
    // Use a timestamp prefix to ensure unique filenames
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
  }
});

// Check file type
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const fileTypes = /jpeg|jpg|png|tif|tiff|gif|bmp|webp/;
  
  // Check extension
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  
  // Check mime type
  const mimetype = fileTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Initialize upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024 // 50MB default
  },
  fileFilter: fileFilter
});

// Error handling for multer uploads
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: `File size exceeds the limit of ${(parseInt(process.env.MAX_FILE_SIZE) / (1024 * 1024)).toFixed(2)} MB`
      });
    }
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

module.exports = { upload, handleUploadError }; 