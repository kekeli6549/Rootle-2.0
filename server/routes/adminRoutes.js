// server/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, isAdmin, isSuperAdmin } = require('../middleware/authMiddleware');
const pool = require('../config/db');

// --- GET STAFF STATS ---
router.get('/stats', protect, isAdmin, async (req, res) => {
    try {
        const deptId = req.user.department_id;
        const pendingCount = await pool.query(
            'SELECT COUNT(*) FROM resources WHERE department_id = $1 AND status = $2',
            [deptId, 'pending']
        );
        const totalFiles = await pool.query(
            'SELECT COUNT(*) FROM resources WHERE department_id = $1 AND status = $2',
            [deptId, 'approved']
        );

        res.json({
            pending: pendingCount.rows[0].count,
            total: totalFiles.rows[0].count
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch stats" });
    }
});

// --- STAFF KEY MANAGEMENT ROUTES ---
// Updated to isSuperAdmin to prevent standard lecturers from generating keys
router.post('/generate-staff-key', protect, isSuperAdmin, adminController.generateStaffKey);
router.get('/staff-keys', protect, isSuperAdmin, adminController.getStaffKeys);

// --- RESOURCE MANAGEMENT ---
// Permanent deletion should also be strictly guarded
router.delete('/permanent-delete/:id', protect, isSuperAdmin, adminController.permanentDelete);

module.exports = router;