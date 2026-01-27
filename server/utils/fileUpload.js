// server/utils/fileUpload.js
const multer = require('multer');
const path = require('path');

// 1. Where to store the files and what to name them
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Save in the uploads folder
    },
    filename: (req, file, cb) => {
        // Give it a unique name: Date + Original Name
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// 2. Filter: Only allow certain file types
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|docx|pptx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (extname) {
        return cb(null, true);
    } else {
        cb(new Error('Error: Only Documents and Images are allowed!'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB Limit
    fileFilter: fileFilter
});

module.exports = upload;