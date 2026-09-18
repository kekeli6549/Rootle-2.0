const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login); 
router.get('/faculties', authController.getFaculties);
router.get('/departments', authController.getDepartments);

module.exports = router;