// server/controllers/authController.js
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { fullName, email, password, role, departmentId } = req.body;

        // 1. Basic Validation (Is the email already there?)
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: "User already exists with this email." });
        }

        // 2. Hash the password (Salt level 10 is industry standard)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Save to Database
        const newUser = await pool.query(
            'INSERT INTO users (full_name, email, password_hash, role, department_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [fullName, email, hashedPassword, role, departmentId]
        );

        res.status(201).json({
            message: "User registered successfully!",
            user: { id: newUser.rows[0].id, name: newUser.rows[0].full_name }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error during registration");
    }
};

// server/controllers/authController.js (Add this below register)

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check if user exists
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: "Invalid Credentials (User not found)" });
        }

        const user = userResult.rows[0];

        // 2. Compare passwords (The scrambled one in DB vs the one typed now)
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid Credentials (Password wrong)" });
        }

        // 3. Create the "Digital ID" (JWT)
        // We hide the user ID and Role inside the token
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' } // Token expires in 1 day
        );

        res.json({
            message: "Login successful!",
            token: token,
            user: {
                id: user.id,
                fullName: user.full_name,
                role: user.role
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error during login");
    }
};