// server/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const pool = require('../config/db');

/// --- GET STAFF STATS ---
// Used to show how many files are pending at a glance
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

module.exports = router;