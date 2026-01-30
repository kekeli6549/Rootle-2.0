const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Added support for Excel/Spreadsheets
    const allowedExtensions = /pdf|docx|pptx|xlsx|jpg|jpeg|png/;
    const allowedMimetypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png'
    ];

    const isExtValid = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const isMimeValid = allowedMimetypes.includes(file.mimetype);

    if (isExtValid && isMimeValid) {
        return cb(null, true);
    } else {
        cb(new Error('Invalid format! PDF, DOCX, PPTX, XLSX and Images only.'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, 
    fileFilter: fileFilter
});

module.exports = upload;