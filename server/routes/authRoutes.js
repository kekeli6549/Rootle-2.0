// server/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Define the route: POST http://localhost:5000/api/auth/register
router.post('/register', authController.register);

// server/routes/authRoutes.js

router.post('/login', authController.login); 
module.exports = router;