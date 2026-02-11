// server/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Define the route: POST http://localhost:5000/api/auth/register
router.post('/register', authController.register);

// server/routes/authRoutes.js

router.post('/login', authController.login); 
router.get('/departments', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name FROM departments ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: "Could not fetch departments" });
    }
});

module.exports = router;

