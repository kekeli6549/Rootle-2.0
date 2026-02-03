// server/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// GET /api/admin/stats
router.get('/stats', protect, isAdmin, adminController.getDashboardStats);

module.exports = router;