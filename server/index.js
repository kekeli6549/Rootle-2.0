// server/index.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');
const os = require('os');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

// Vercel (and most platforms) terminate TLS and forward requests through a proxy.
// express-rate-limit needs this to trust x-forwarded-for instead of throwing.
app.set('trust proxy', 1);

// Only the real frontend origins may call the API. Trailing slashes are stripped
// because CORS matches origins exactly.
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://rootle-2-0.vercel.app',
  'https://rootle-2-0-6p7mxd9cu-lord-frostbytes-projects-d5e710e2.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean).map((origin) => origin.replace(/\/+$/, ''));

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: (origin, callback) => {
    // Allow health checks / server-to-server calls that have no Origin header.
    if (!origin || allowedOrigins.includes(origin.replace(/\/+$/, ''))) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
  exposedHeaders: ['Content-Disposition']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP."
});
app.use('/api/', limiter);

// On Vercel uploads live in /tmp; locally they live in server/uploads.
const uploadDir = process.env.VERCEL
  ? path.join(os.tmpdir(), 'rootle-uploads')
  : path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadDir));

// Quick health check (works even if the DB is temporarily unavailable).
app.get('/', (req, res) => {
  res.json({ message: "Rootle API is live, Chief!" });
});

// --- DATABASE + SEED INITIALIZATION (cached for warm serverless invocations) ---
// --- AUTOMATIC IDEMPOTENT SEEDER ---
async function seedDatabase() {
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

    // 2. Idempotent SuperAdmin Creation.
    // Never reset an existing password on deploy: only create the account once.
    const superAdminEmail = 'sysadmin@rootle.com';
    if (!await User.exists({ email: superAdminEmail })) {
      if (!process.env.SUPERADMIN_PASSWORD) {
        console.warn('⚠️ SUPERADMIN_PASSWORD is not set; skipping superadmin seed.');
      } else {
        const salt = await bcrypt.genSalt(10);
        await User.create({
          full_name: 'Rootle System Core',
          email: superAdminEmail,
          password_hash: await bcrypt.hash(process.env.SUPERADMIN_PASSWORD, salt),
          role: 'superadmin',
          staff_id: 'ROOTLE-SA-01'
        });
        console.log('⚡ SuperAdmin account seeded.');
      }
    }

    // 3. Idempotent Department Admin Creation.
    // DEPT_ADMIN_PASSWORD is optional; existing accounts are never overwritten.
    const adminEmail = 'deptadmin@rootle.com';
    if (!await User.exists({ email: adminEmail })) {
      if (!process.env.DEPT_ADMIN_PASSWORD || !defaultDeptId) {
        console.warn('⚠️ DEPT_ADMIN_PASSWORD not set; skipping department admin seed.');
      } else {
        const salt = await bcrypt.genSalt(10);
        await User.create({
          full_name: 'CS Dept Admin',
          email: adminEmail,
          password_hash: await bcrypt.hash(process.env.DEPT_ADMIN_PASSWORD, salt),
          role: 'admin',
          department_id: defaultDeptId,
          staff_id: 'ROOTLE-ADM-01'
        });
        console.log('🛡️ Department Admin account seeded.');
      }
    }

  } catch (err) {
    console.error('❌ Seeding background error:', err.message);
  }
}

let initializePromise = null;
const initialize = () => {
  if (!initializePromise) {
    initializePromise = (async () => {
      await connectDB();
      await seedDatabase();
    })().catch((err) => {
      // Allow a later invocation to retry instead of staying permanently failed.
      initializePromise = null;
      throw err;
    });
  }
  return initializePromise;
};

// Every API request waits for a live DB connection (cold start safe).
app.use(async (req, res, next) => {
  try {
    await initialize();
    next();
  } catch (err) {
    next(err);
  }
});

// Routes
const authRoutes = require('./routes/authRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Express Error:', err.message);
  const status = err.message && err.message.includes('CORS') ? 403 : 500;
  res.status(status).json({ error: status === 403 ? 'Forbidden' : 'Server Error' });
});

// --- SERVER INITIALIZATION ---
const PORT = process.env.PORT || 5000;

// Locally we open a port. On Vercel the exported app is used by @vercel/node.
if (!process.env.VERCEL) {
  initialize()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 Rootle Backend listening actively on http://localhost:${PORT}`);
      });
    })
    .catch((error) => {
      console.error('🚨 FATAL: Failed to connect to Database. Server shutting down.');
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = app;
