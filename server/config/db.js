// server/config/db.js
const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool (industry standard for performance)
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Test the connection
pool.on('connect', () => {
    console.log('✅ Connected to the Rootle Database');
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};