const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Department = require('../models/Department');
const Faculty = require('../models/Faculty');
const StaffKey = require('../models/StaffKey');

// Helper function to check 120-second key timeout rules
const validateAndBurnKey = async (staffKeyInput) => {
  const keyRecord = await StaffKey.findOne({ key: staffKeyInput });
  if (!keyRecord) {
    return { error: "Invalid staff registration key." };
  }
  if (keyRecord.is_used) {
    return { error: "This staff key has already been consumed." };
  }
  
  const now = new Date();
  if (now > keyRecord.expires_at) {
    return { error: "This staff key has expired." };
  }

  // 120-Second Burn-on-First-Input / Generation Check
  if (keyRecord.first_attempted_at) {
    const elapsedSeconds = (now - new Date(keyRecord.first_attempted_at)) / 1000;
    if (elapsedSeconds > 120) {
      keyRecord.is_used = true;
      await keyRecord.save();
      return { error: "This staff key has expired (exceeded the 120-second active window after first input)." };
    }
  } else {
    // Stamp the start of the 120-second countdown window on first view/attempt
    keyRecord.first_attempted_at = now;
    await keyRecord.save();
  }

  return { keyRecord };
};

exports.getFaculties = async (req, res) => {
  try {
    const faculties = await Faculty.find().sort({ name: 1 });
    res.status(200).json(faculties || []);
  } catch (err) {
    console.error("Error fetching faculties:", err.message);
    res.status(500).json([]);
  }
};

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

exports.register = async (req, res) => {
  try {
    const { fullName, email, password, role, departmentId, idNumber, staffKey } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists." });

    let targetDeptId = departmentId;
    let assignedRole = role || 'student';
    let keyRecord = null;

    // 1. MASTER KEY LOGIC FOR THE FIRST SUPER ADMIN
    if (staffKey === 'ROOTLE-ALPHA-26') {
      const superAdminExists = await User.findOne({ role: 'superadmin' });
      
      if (superAdminExists) {
        return res.status(403).json({ 
          message: "A Super Admin already exists. Please request a generated staff key from the current Super Admin." 
        });
      }
      
      assignedRole = 'superadmin';
      targetDeptId = null; 
    } 
    // 2. STANDARD GENERATED KEY LOGIC WITH 120s WINDOW
    else if (staffKey) {
      const validation = await validateAndBurnKey(staffKey);
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      keyRecord = validation.keyRecord;

      targetDeptId = keyRecord.department_id;
      assignedRole = keyRecord.role;
    } 
    // 3. SAFEGUARD AGAINST UNAUTHORIZED STAFF ROLES
    else if (assignedRole === 'lecturer' || assignedRole === 'admin' || assignedRole === 'superadmin') {
      return res.status(400).json({ message: "Staff registration key is required." });
    } 
    // 4. STUDENT FALLBACK
    else {
      if (!departmentId) {
        return res.status(400).json({ message: "Department selection is required." });
      }
    }

    let deptCheck = null;
    if (assignedRole !== 'superadmin') {
      deptCheck = await Department.findById(targetDeptId).populate('faculty_id');
      if (!deptCheck) return res.status(400).json({ message: "Invalid department selection." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      full_name: fullName,
      email,
      password_hash: hashedPassword,
      role: assignedRole,
      department_id: targetDeptId,
      student_id: assignedRole === 'student' ? idNumber : null,
      staff_id: assignedRole !== 'student' ? idNumber : null
    });

    // Permanently burn the key upon successful registration completion
    if (keyRecord) {
      keyRecord.is_used = true;
      await keyRecord.save();
    }

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
        departmentName: deptCheck ? deptCheck.name : 'System Central',
        facultyName: deptCheck?.faculty_id?.name || 'Rootle Core',
        idNumber: newUser.staff_id || newUser.student_id
      }
    });
  } catch (err) {
    console.error("Registration Error:", err.message);
    res.status(500).json({ message: "Server Error during registration" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, staffKey } = req.body;
    
    let keyRecord = null;
    // If a staffKey is supplied during login validation checkpoints, validate the 120s window
    if (staffKey && staffKey !== 'ROOTLE-ALPHA-26') {
      const validation = await validateAndBurnKey(staffKey);
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }
      keyRecord = validation.keyRecord;
    }

    const user = await User.findOne({ email }).populate({
      path: 'department_id',
      populate: { path: 'faculty_id' }
    });

    if (!user) return res.status(400).json({ message: "Invalid Credentials" });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: "Invalid Credentials" });

    // Burn key on successful login validation if applicable
    if (keyRecord) {
      keyRecord.is_used = true;
      await keyRecord.save();
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, department_id: user.department_id?._id || null }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.full_name,
        role: user.role,
        departmentId: user.department_id?._id || null,
        departmentName: user.department_id?.name || 'System Central', 
        facultyName: user.department_id?.faculty_id?.name || 'Rootle Core',
        idNumber: user.staff_id || user.student_id
      }
    });
  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};