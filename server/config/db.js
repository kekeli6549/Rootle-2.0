// server/config/db.js
const { Pool } = require('pg');
const path = require('path');

// 1. Force load dotenv from the root directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// 2. DEBUG: This will show in your terminal. 
// If it says 'undefined', the .env file isn't being read.
console.log("🛠️ DB Attempting connect with user:", process.env.DB_USER);

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    // The Fix: Ensure it's a string and provide a fallback to avoid the SASL error
    password: String(process.env.DB_PASSWORD || ''), 
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
});

pool.on('connect', () => {
    console.log('✅ Rootle Database: Connection Established');
});

pool.on('error', (err) => {
    console.error('❌ Rootle Database: Unexpected Error', err);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};