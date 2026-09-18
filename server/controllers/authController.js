const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Department = require('../models/Department');
const Faculty = require('../models/Faculty');

// --- GET FACULTIES ---
exports.getFaculties = async (req, res) => {
    try {
        const faculties = await Faculty.find().sort({ name: 1 });
        res.status(200).json(faculties || []);
    } catch (err) {
        console.error("Error fetching faculties:", err.message);
        res.status(500).json([]);
    }
};

// --- GET DEPARTMENTS (WITH OPTIONAL FACULTY FILTER) ---
exports.getDepartments = async (req, res) => {
    try {
        const { facultyId } = req.query;
        let query = {};
        if (facultyId && facultyId !== 'undefined' && facultyId !== 'null') {
            query.faculty_id = facultyId;
        }
        const departments = await Department.find(query).sort({ name: 1 }).select('name faculty_id');
        res.status(200).json(departments || []); 
    } catch (err) {
        console.error("Database Error in getDepartments:", err.message);
        res.status(500).json([]); 
    }
};

// --- REGISTER USER ---
exports.register = async (req, res) => {
    try {
        const { fullName, email, password, role, departmentId, idNumber, staffKey } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: "User already exists." });

        const deptCheck = await Department.findById(departmentId).populate('faculty_id');
        if (!deptCheck) return res.status(400).json({ message: "Invalid department selection." });

        if (role === 'lecturer' || role === 'admin') {
            const validKey = process.env.STAFF_KEY || process.env.VITE_STAFF_KEY;
            if (staffKey !== validKey) {
                return res.status(403).json({ message: "Invalid Admin Passkey. Access Denied." });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            full_name: fullName,
            email,
            password_hash: hashedPassword,
            role,
            department_id: departmentId,
            student_id: role === 'student' ? idNumber : null,
            staff_id: (role === 'lecturer' || role === 'admin') ? idNumber : null
        });

        const token = jwt.sign(
            { id: newUser._id, role: newUser.role, department_id: newUser.department_id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: "Welcome to the family!",
            token,
            user: { 
                id: newUser._id, 
                fullName: newUser.full_name,
                role: newUser.role,
                departmentId: newUser.department_id,
                departmentName: deptCheck.name,
                facultyName: deptCheck.faculty_id?.name,
                idNumber: newUser.staff_id || newUser.student_id
            }
        });
    } catch (err) {
        console.error("Registration Error:", err.message);
        res.status(500).json({ message: "Server Error during registration" });
    }
};

// --- LOGIN USER ---
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).populate({
            path: 'department_id',
            populate: { path: 'faculty_id' }
        });

        if (!user) return res.status(400).json({ message: "Invalid Credentials" });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ message: "Invalid Credentials" });

        const token = jwt.sign(
            { id: user._id, role: user.role, department_id: user.department_id._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                fullName: user.full_name,
                role: user.role,
                departmentId: user.department_id._id,
                departmentName: user.department_id.name, 
                facultyName: user.department_id.faculty_id?.name,
                idNumber: user.staff_id || user.student_id
            }
        });
    } catch (err) {
        console.error("Login Error:", err.message);
        res.status(500).json({ message: "Server Error" });
    }
};