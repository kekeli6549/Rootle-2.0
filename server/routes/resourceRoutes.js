const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const protect = require('../middleware/authMiddleware');
const upload = require('../utils/fileUpload');

router.post('/upload', protect, upload.single('file'), resourceController.uploadResource);
router.get('/', protect, resourceController.getAllResources);

// NEW: Soft delete / Deletion request
router.delete('/:id', protect, resourceController.requestDeletion);

// Track "Heat"
router.post('/download/:id', protect, resourceController.incrementDownload);

module.exports = router;