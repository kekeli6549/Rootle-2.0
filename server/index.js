// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');


// 1. Initialize the app FIRST
const app = express();

// 2. Import routes
const pool = require('./config/db'); 
const authRoutes = require('./routes/authRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const adminRoutes = require('./routes/adminRoutes');

// 3. Setup Limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100,
    message: "Too many requests from this IP, please try again after 15 minutes"
});

// --- MIDDLEWARE ---
app.use(limiter);
app.use(helmet({
    crossOriginResourcePolicy: false, // Allows the browser to load files from your /uploads folder
}));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- ROUTES ---

// Health Check
app.get('/', (req, res) => {
    res.json({ message: "Rootle API is running smoothly, Chief!" });
});

// Feature Routes
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/admin', adminRoutes);

// --- ERROR HANDLING ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke on the server side!');
});

// --- SERVER START ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server is running on port ${PORT}`);
    console.log(`👉 Test it here: http://localhost:${PORT}`);
});