const pool = require('../config/db'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- REGISTER USER ---
exports.register = async (req, res) => {
    try {
        const { fullName, email, password, role, departmentId, idNumber } = req.body;

        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: "User already exists." });
        }

        const deptCheck = await pool.query('SELECT name FROM departments WHERE id = $1', [departmentId]);
        if (deptCheck.rows.length === 0) {
            return res.status(400).json({ message: "Invalid department selection." });
        }
        const departmentName = deptCheck.rows[0].name;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const studentId = role === 'student' ? idNumber : null;
        const staffId = role === 'lecturer' ? idNumber : null;

        const newUserResult = await pool.query(
            `INSERT INTO users (full_name, email, password_hash, role, department_id, student_id, staff_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [fullName, email, hashedPassword, role, departmentId, studentId, staffId]
        );

        const user = newUserResult.rows[0];

        const token = jwt.sign(
            { id: user.id, role: user.role, department_id: user.department_id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: "Welcome to the family!",
            token,
            user: { 
                id: user.id, 
                fullName: user.full_name,
                role: user.role,
                departmentId: user.department_id,
                departmentName: departmentName,
                idNumber: staffId || studentId
            }
        });
    } catch (err) {
        console.error("Registration Error:", err.message);
        res.status(500).json({ message: "Oshey! Server Error during registration" });
    }
};

// --- LOGIN USER ---
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userResult = await pool.query(
            `SELECT users.*, departments.name as dept_name 
             FROM users 
             LEFT JOIN departments ON users.department_id = departments.id 
             WHERE users.email = $1`, 
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ message: "Invalid Credentials" });

        const token = jwt.sign(
            { id: user.id, role: user.role, department_id: user.department_id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                fullName: user.full_name,
                role: user.role,
                departmentId: user.department_id,
                departmentName: user.dept_name, 
                idNumber: user.staff_id || user.student_id
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
};

// --- GET DEPARTMENTS ---
exports.getDepartments = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name FROM departments ORDER BY name ASC');
        // Always return an array, even if empty, to prevent frontend .map() crashes
        res.status(200).json(result.rows || []); 
    } catch (err) {
        console.error("Database Error in getDepartments:", err.message);
        // Fallback to empty array so the frontend doesn't break
        res.status(500).json([]); 
    }
};