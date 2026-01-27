// server/index.js
const pool = require('./config/db'); // Import the database connection
const adminRoutes = require('./routes/adminRoutes');
// Import the necessary ingredients
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config(); // Load environment variables
const authRoutes = require('./routes/authRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
// Initialize the app
const app = express();

// --- MIDDLEWARE (The Gatekeepers) ---

// 1. Security headers (Helmet makes it harder for hackers to exploit headers)
app.use(helmet());

// 2. Cross-Origin Resource Sharing (Allows React to talk to this server)
app.use(cors());

// 3. Parser (Allows the server to read JSON data sent from the frontend)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Logger (Shows us request details in the terminal)
app.use(morgan('dev')); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- ROUTES (The Pathways) ---
// We will add the actual routes later. For now, let's test if it works.
app.get('/', (req, res) => {
    res.json({ message: "Rootle API is running smoothly, Chief!" });
});
app.use('/api/auth', authRoutes);
// --- ERROR HANDLING (The Safety Net) ---
// If something breaks, we don't want the app to crash silently.
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke on the server side!');
});
app.use('/api/resources', resourceRoutes);

app.get('/', (req, res) => {
    res.json({ message: "Rootle API is running smoothly, Chief!" });
});

app.use('/api/admin', adminRoutes);


// --- SERVER START ---
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`\n🚀 Server is running on port ${PORT}`);
    console.log(`👉 Test it here: http://localhost:${PORT}`);
});