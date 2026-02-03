// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();

// 1. Routes
const authRoutes = require('./routes/authRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const adminRoutes = require('./routes/adminRoutes');

// 2. Middleware
app.use(helmet({
    crossOriginResourcePolicy: false, // CRITICAL: Allows the browser to load files from your server
}));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// 3. Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP."
});
app.use('/api/', limiter);

// 4. Serve Static Files (The Vault)
// This makes http://localhost:5000/uploads/filename.pdf accessible
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 5. Routes
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => res.json({ message: "Rootle API is live, Chief!" }));

// 6. Error Handler
app.use((err, req, res, next) => {
    console.error("🔥 Error:", err.message);
    res.status(500).json({ error: "Server Error", message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));