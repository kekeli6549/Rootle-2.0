const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const upload = require('../middleware/upload'); // Unified to use our new Multer config
const { protect, isAdmin } = require('../middleware/authMiddleware');

// ==========================================
//   PUBLIC / STUDENT ACCESSIBLE ROUTES
// ==========================================

/**
 * @route   POST /api/resources/upload
 * @desc    Upload a new resource (Starts as 'pending')
 * @access  Private (Students/Staff)
 */
// 'file' matches the name used in the Frontend FormData: formData.append('file', file);
router.post('/upload', protect, upload.single('file'), resourceController.uploadResource);

/**
 * @route   GET /api/resources
 * @desc    Get resources (Filtered by status, category, etc.)
 * @access  Private
 */
router.get('/', protect, resourceController.getAllResources);

/**
 * @route   DELETE /api/resources/:id
 * @desc    Request a deletion (Soft delete / Student removes from their view)
 * @access  Private (Owner only)
 */
router.delete('/:id', protect, resourceController.requestDeletion);

/**
 * @route   POST /api/resources/download/:id
 * @desc    Increment download count (The "Heat" factor)
 * @access  Private
 */
router.post('/download/:id', protect, resourceController.incrementDownload);


// ==========================================
//   STAFF / ADMIN ONLY ROUTES (The Command Center)
// ==========================================

/**
 * @route   POST /api/resources/admin/approve/:id
 * @desc    Verify & Publish a pending resource
 * @access  Private (Lecturer/Admin)
 */
router.post('/admin/approve/:id', protect, isAdmin, resourceController.approveResource);

/**
 * @route   DELETE /api/resources/admin/reject/:id
 * @desc    Decline/Reject a pending resource
 * @access  Private (Lecturer/Admin)
 */
// Changed from 'approve' to 'reject' in the URL for clarity, 
// make sure this matches your handleAction call!
router.delete('/admin/reject/:id', protect, isAdmin, resourceController.rejectResource);

/**
 * @route   GET /api/resources/admin/deletion-requests
 * @desc    Fetch resources flagged for permanent deletion (Dept-Specific)
 * @access  Private (Lecturer/Admin)
 */
router.get('/admin/deletion-requests', protect, isAdmin, resourceController.getDeletionRequests);

/**
 * @route   DELETE /api/resources/admin/permanent-delete/:id
 * @desc    Permanent removal from DB and physical storage
 * @access  Private (Lecturer/Admin)
 */
// Changed to DELETE to match your frontend logic: method: ... ? 'DELETE' : 'POST'
router.delete('/admin/permanent-delete/:id', protect, isAdmin, resourceController.permanentDelete);

module.exports = router;