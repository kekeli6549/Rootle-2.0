const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const upload = require('../middleware/upload'); 
const { protect, isAdmin } = require('../middleware/authMiddleware');

// STUDENT & GENERAL
router.post('/upload', protect, upload.single('file'), resourceController.uploadResource);
router.get('/', protect, resourceController.getAllResources);
router.get('/stats', protect, resourceController.getDepartmentStats); // New
router.post('/rate', protect, resourceController.rateResource); // New
router.delete('/:id', protect, resourceController.requestDeletion);
router.delete('/admin/reject-deletion/:id', protect, isAdmin, resourceController.rejectDeletion);
router.post('/download/:id', protect, resourceController.incrementDownload);

// REQUEST HUB
router.post('/requests', protect, resourceController.createRequest);
router.get('/requests', protect, resourceController.getRequests);
router.put('/requests/:id/fulfill', protect, resourceController.fulfillRequest);

// STAFF / ADMIN
router.put('/admin/approve/:id', protect, isAdmin, resourceController.approveResource);
router.get('/admin/deletion-requests', protect, isAdmin, resourceController.getDeletionRequests);
router.delete('/admin/permanent-delete/:id', protect, isAdmin, resourceController.permanentDelete);

module.exports = router;