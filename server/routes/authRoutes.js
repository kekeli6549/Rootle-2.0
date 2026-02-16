const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST http://localhost:5000/api/auth/register
router.post('/register', authController.register);

// POST http://localhost:5000/api/auth/login
router.post('/login', authController.login); 

// GET http://localhost:5000/api/auth/departments
router.get('/departments', authController.getDepartments);

module.exports = router;