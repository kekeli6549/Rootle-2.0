// server/config/db.js
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// This console log is your best friend right now. 
// If it says 'undefined' when you start the server, the path above is still wrong.
console.log("🛠️ Checking DB Password length:", process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : "MISSING");

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: String(process.env.DB_PASSWORD || ''), // Force string conversion
    port: parseInt(process.env.DB_PORT || '5432'),
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};