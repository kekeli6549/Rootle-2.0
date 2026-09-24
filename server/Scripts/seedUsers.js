const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Or 'bcrypt' depending on your package setup
require('dotenv').config();

// Load Mongoose models (adjust paths if your models directory is located elsewhere)
const User = require('../models/User');
const Department = require('../models/Department');
const Faculty = require('../models/Faculty');

const DEFAULT_PASSWORD = 'Password123!';

const seedUsers = async () => {
  try {
    // 1. Connect to Database
    const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/rootle';
    await mongoose.connect(dbUri);
    console.log('🔌 Connected to MongoDB for user seeding...');

    // 2. Fetch all existing Departments
    const departments = await Department.find({}).populate('faculty_id');

    if (departments.length === 0) {
      console.log('⚠️ No departments found in database! Please ensure Faculties and Departments are created first.');
      process.exit(1);
    }

    console.log(`🔍 Found ${departments.length} department(s). Checking existing users...`);

    // 3. Hash default password once for performance
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, salt);

    let createdCount = 0;
    let skippedCount = 0;

    for (const dept of departments) {
      // Create a clean alphanumeric slug from department name (e.g., "Computer Science" -> "computerscience")
      const deptSlug = dept.name.toLowerCase().replace(/[^a-z0-9]/g, '');

      // ==========================================
      // A. LECTURER SEEDING
      // ==========================================
      const lecturerEmail = `lecturer.${deptSlug}@rootle.edu`;
      
      // Check if a lecturer already exists for this email OR for this department
      const existingLecturer = await User.findOne({
        $or: [
          { email: lecturerEmail },
          { department_id: dept._id, role: 'lecturer' }
        ]
      });

      if (!existingLecturer) {
        await User.create({
          full_name: `Dr. ${dept.name} Lecturer`,
          email: lecturerEmail,
          password_hash: hashedPassword,
          role: 'lecturer',
          department_id: dept._id,
          staff_id: `LEC-${deptSlug.toUpperCase()}-001`,
          level: 5,
          badgeTitle: 'Senior Scholar',
          totalUploads: 0
        });
        console.log(`✅ Created Lecturer for: ${dept.name} (${lecturerEmail})`);
        createdCount++;
      } else {
        console.log(`⏭️  Lecturer already exists for department: ${dept.name}. Skipping...`);
        skippedCount++;
      }

      // ==========================================
      // B. STUDENT SEEDING
      // ==========================================
      const studentEmail = `student.${deptSlug}@rootle.edu`;

      // Check if a student already exists for this email OR for this department
      const existingStudent = await User.findOne({
        $or: [
          { email: studentEmail },
          { department_id: dept._id, role: 'student' }
        ]
      });

      if (!existingStudent) {
        await User.create({
          full_name: `Student ${dept.name}`,
          email: studentEmail,
          password_hash: hashedPassword,
          role: 'student',
          department_id: dept._id,
          student_id: `STU-${deptSlug.toUpperCase()}-2026`,
          level: 1,
          badgeTitle: 'Novice Scholar',
          totalUploads: 0
        });
        console.log(`✅ Created Student for: ${dept.name} (${studentEmail})`);
        createdCount++;
      } else {
        console.log(`⏭️  Student already exists for department: ${dept.name}. Skipping...`);
        skippedCount++;
      }
    }

    console.log(`\n🎉 User seeding process finished!`);
    console.log(`📊 Summary: ${createdCount} new account(s) created | ${skippedCount} existing account(s) untouched.`);
    console.log(`🔒 SuperAdmins, custom accounts, and previous seeds were left completely intact.\n`);

  } catch (error) {
    console.error('❌ Error executing user seed script:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
    process.exit(0);
  }
};

seedUsers();