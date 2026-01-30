const pool = require('../config/db'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { fullName, email, password, role, department, idNumber } = req.body;

        // 1. Validation
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: "User already exists." });
        }

        // 2. Map Department Name to Department ID
        // We look for a department name that matches the selection
        const deptResult = await pool.query('SELECT id FROM departments WHERE name = $1', [department]);
        
        if (deptResult.rows.length === 0) {
            return res.status(400).json({ message: "Selected department does not exist in our records." });
        }
        const departmentId = deptResult.rows[0].id;

        // 3. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Logic: ID Mapping
        const studentId = role === 'student' ? idNumber : null;
        const staffId = role === 'lecturer' ? idNumber : null;

        // 5. Save to Database
        // Updated to use department_id (UUID) and the new ID columns
        const newUser = await pool.query(
            `INSERT INTO users (full_name, email, password_hash, role, department_id, student_id, staff_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [fullName, email, hashedPassword, role, departmentId, studentId, staffId]
        );

        res.status(201).json({
            message: "User registered successfully!",
            user: { 
                id: newUser.rows[0].id, 
                fullName: newUser.rows[0].full_name,
                role: newUser.rows[0].role,
                departmentId: newUser.rows[0].department_id
            }
        });

    } catch (err) {
        console.error("Registration Error:", err.message);
        res.status(500).json({ message: "Server Error during registration" });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );

        res.json({
            message: "Login successful!",
            token,
            user: {
                id: user.id,
                fullName: user.full_name,
                role: user.role,
                departmentId: user.department_id // Essential for the Department Feed!
            }
        });

    } catch (err) {
        console.error("Login Error:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};