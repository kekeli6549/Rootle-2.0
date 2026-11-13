// server/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, isAdmin, isSuperAdmin } = require('../middleware/authMiddleware');



// --- GET STAFF STATS ---
router.get('/stats', protect, isAdmin, async (req, res) => {
    try {
        const deptId = req.user.department_id;
        
    
        res.json({ pending: 0, total: 0 });
        
    } catch (err) {
        console.error("Stats Error:", err);
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