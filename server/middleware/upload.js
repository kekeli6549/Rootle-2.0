const multer = require('multer');
const path = require('path');

// GridFS stores the bytes in MongoDB, so multer keeps them in memory only.
// This removes the read-only /tmp dependency entirely.
// Note: Vercel Hobby still caps request bodies at ~4.5 MB before Node sees them.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|png|jpg|jpeg|pptx|xlsx/;
    const originalName = file.originalname || '';
    const validExt = allowedTypes.test(path.extname(originalName).toLowerCase());
    const validMime = allowedTypes.test(file.mimetype || '');

    if (validExt && validMime) return cb(null, true);
    cb(new Error('Only PDF, DOC/DOCX, PPTX, XLSX and image files are allowed!'));
  }
});

module.exports = upload;
