// server/config/db.js
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rootle';
        console.log("🛠️ Attempting MongoDB Connection...");

        await mongoose.connect(mongoUri);
        console.log('✅ Rootle Database: MongoDB Connected & Ready.');
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;