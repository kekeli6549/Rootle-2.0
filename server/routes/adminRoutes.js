// server/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, isAdmin, isSuperAdmin } = require('../middleware/authMiddleware');

// Import your Mongoose models instead of Postgres 'pool'
// (Ensure you have a Resource model created in your models folder)
// const Resource = require('../models/Resource'); 

// --- GET STAFF STATS ---
router.get('/stats', protect, isAdmin, async (req, res) => {
    try {
        const deptId = req.user.department_id;
        
        // NOTE: Uncomment these lines once your Resource Mongoose model is ready
        /*
        const pendingCount = await Resource.countDocuments({ department_id: deptId, status: 'pending' });
        const totalFiles = await Resource.countDocuments({ department_id: deptId, status: 'approved' });

        res.json({
            pending: pendingCount,
            total: totalFiles
        });
        */
       
        // Temporary placeholder response to prevent app crash until Resource model is built
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