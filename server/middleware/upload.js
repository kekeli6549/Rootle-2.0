const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Vercel's filesystem is read-only except for /tmp. Writing to a folder inside
// the project would throw EROFS and take the whole API down on cold start.
const uploadDir = process.env.VERCEL
  ? path.join(os.tmpdir(), 'rootle-uploads')
  : path.join(__dirname, '../uploads');

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.error('⚠️ Could not prepare upload directory:', err.message);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Example: 1738312345-lesson-notes.pdf
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Only allow PDFs, Docs, and Images
  const allowedTypes = /pdf|doc|docx|png|jpg|jpeg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only document and image files are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB Limit
  fileFilter: fileFilter
});

module.exports = upload;
