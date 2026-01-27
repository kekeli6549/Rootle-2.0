// server/routes/resourceRoutes.js
const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const protect = require('../middleware/authMiddleware'); // Our Bouncer
const upload = require('../utils/fileUpload'); // Our Post Office

// Route: POST /api/resources/upload
// Note how we use 'protect' first to make sure they are logged in!
router.post('/upload', protect, upload.single('file'), resourceController.uploadResource);

module.exports = router;