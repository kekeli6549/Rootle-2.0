// server/index.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

connectDB();

// --- AUTOMATIC IDEMPOTENT SEEDER ---
const seedDatabase = async () => {
  try {
    const Faculty = require('./models/Faculty');
    const Department = require('./models/Department');
    const User = require('./models/User');

    // 1. Seed Faculties & Departments
    const structure = [
      { faculty: 'Science', departments: ['Computer Science', 'Physics'] },
      { faculty: 'Arts', departments: ['English Literature', 'History'] },
      { faculty: 'Commercial', departments: ['Accounting', 'Economics'] }
    ];

    let defaultDeptId = null;

    for (const item of structure) {
      let facultyDoc = await Faculty.findOne({ name: item.faculty });
      if (!facultyDoc) {
        facultyDoc = await Faculty.create({ name: item.faculty });
      }

      for (const deptName of item.departments) {
        let deptExists = await Department.findOne({ name: deptName, faculty_id: facultyDoc._id });
        if (!deptExists) {
          deptExists = await Department.create({ name: deptName, faculty_id: facultyDoc._id });
        }
        if (!defaultDeptId) defaultDeptId = deptExists._id;
      }
    }
    console.log('🌱 Faculties & Departments verified.');

    // 2. Idempotent SuperAdmin Creation
    const salt = await bcrypt.genSalt(10);
    const superAdminPassword = await bcrypt.hash(process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@123', salt);

    await User.findOneAndUpdate(
      { email: 'sysadmin@rootle.com' },
      {
        full_name: 'Rootle System Core',
        email: 'sysadmin@rootle.com',
        password_hash: superAdminPassword,
        role: 'superadmin',
        staff_id: 'ROOTLE-SA-01'
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log('⚡ SuperAdmin account verified/seeded.');

    // 3. Idempotent Department Admin Creation
    const adminPassword = await bcrypt.hash('Admin@123', salt);
    await User.findOneAndUpdate(
      { email: 'deptadmin@rootle.com' },
      {
        full_name: 'CS Dept Admin',
        email: 'deptadmin@rootle.com',
        password_hash: adminPassword,
        role: 'admin',
        department_id: defaultDeptId,
        staff_id: 'ROOTLE-ADM-01'
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log('🛡️ Department Admin account verified/seeded.');

  } catch (err) {
    console.error('Seeding background error:', err.message);
  }
};

mongoose.connection.once('open', () => {
  seedDatabase();
});

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP."
});
app.use('/api/', limiter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/authRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.json({ message: "Rootle API is live, Chief!" });
});

app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ error: "Server Error", err: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));