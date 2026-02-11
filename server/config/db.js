// server/config/db.js
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

console.log("🛠️ Checking DB Password length:", process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : "MISSING");

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: String(process.env.DB_PASSWORD || ''),
    port: parseInt(process.env.DB_PORT || '5432'), // Matching your .env port
});

// Test the connection immediately on startup
pool.connect((err, client, release) => {
    if (err) {
        return console.error('❌ Database connection failed:', err.stack);
    }
    console.log('✅ Rootle Database: Connected & Ready.');
    release();
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool // Exporting pool itself is sometimes helpful for advanced transactions
};