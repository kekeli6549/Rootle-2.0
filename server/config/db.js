// server/config/db.js
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

let connectionPromise = null;

const connectDB = async () => {
    // Already connected (important for warm serverless invocations).
    if (mongoose.connection.readyState === 1) return mongoose.connection;

    if (!connectionPromise) {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI is not configured. Add it to the Vercel project Environment Variables.');
        }

        connectionPromise = mongoose.connect(mongoUri)
            .then(() => {
                console.log('✅ Rootle Database: MongoDB Connected & Ready.');
                return mongoose.connection;
            })
            .catch((err) => {
                // Do NOT process.exit() here: in serverless this would kill the
                // function and hide the real error. Let the caller handle it.
                connectionPromise = null;
                console.error('❌ Database connection failed:', err.message);
                throw err;
            });
    }

    return connectionPromise;
};

module.exports = connectDB;
