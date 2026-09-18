// server/index.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

// Connect to MongoDB Database
connectDB();

// --- AUTOMATIC SEEDER FOR FACULTIES & DEPARTMENTS ---
const seedFacultiesAndDepartments = async () => {
  try {
    const Faculty = require('./models/Faculty');
    const Department = require('./models/Department');

    const structure = [
      { faculty: 'Science', departments: ['Computer Science', 'Physics'] },
      { faculty: 'Arts', departments: ['English Literature', 'History'] },
      { faculty: 'Commercial', departments: ['Accounting', 'Economics'] }
    ];

    for (const item of structure) {
      let facultyDoc = await Faculty.findOne({ name: item.faculty });
      if (!facultyDoc) {
        facultyDoc = await Faculty.create({ name: item.faculty });
      }

      for (const deptName of item.departments) {
        const deptExists = await Department.findOne({ name: deptName, faculty_id: facultyDoc._id });
        if (!deptExists) {
          await Department.create({ name: deptName, faculty_id: facultyDoc._id });
        }
      }
    }
    console.log('🌱 Faculties & Departments seeded successfully.');
  } catch (err) {
    console.error('Seeding background error:', err.message);
  }
};

// Trigger seeding once database connection opens
mongoose.connection.once('open', () => {
  seedFacultiesAndDepartments();
});

// 1. Middleware
app.use(helmet({
    crossOriginResourcePolicy: false, // Critical: Allows the browser to load files from your server
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// 2. Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP."
});
app.use('/api/', limiter);

// 3. Serve Static Files (The Vault)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 4. Routes
const authRoutes = require('./routes/authRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.json({ message: "Rootle API is live, Chief!" });
});

// 5. Error Handler
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    res.status(500).json({ error: "Server Error", err: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));