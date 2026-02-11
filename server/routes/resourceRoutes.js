const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const upload = require('../middleware/upload'); 
const { protect, isAdmin } = require('../middleware/authMiddleware');

// STUDENT ROUTES
router.post('/upload', protect, upload.single('file'), resourceController.uploadResource);
router.get('/', protect, resourceController.getAllResources);
router.delete('/:id', protect, resourceController.requestDeletion);
router.post('/download/:id', protect, resourceController.incrementDownload);

// STAFF ROUTES
router.put('/admin/approve/:id', protect, isAdmin, resourceController.approveResource);
router.delete('/admin/reject/:id', protect, isAdmin, resourceController.permanentDelete); // Use purge logic for rejections
router.get('/admin/deletion-requests', protect, isAdmin, resourceController.getDeletionRequests);
router.delete('/admin/permanent-delete/:id', protect, isAdmin, resourceController.permanentDelete);



module.exports = router;