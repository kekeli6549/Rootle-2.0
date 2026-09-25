const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import your Mongoose User model

const protect = async (req, res, next) => {
    // Look for token in x-auth-token header
    const token = req.header('x-auth-token');

    if (!token) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fetch the fresh user from the database. 
        // (Use decoded._id or decoded.id depending on how you signed the JWT)
        const userId = decoded.id || decoded._id;
        req.user = await User.findById(userId).select('-password_hash');

        if (!req.user) {
             return res.status(401).json({ message: "User no longer exists. Authorization denied." });
        }

        next();
    } catch (err) {
        console.error("JWT Error:", err.message);
        res.status(401).json({ message: "Token is not valid" });
    }
};

const isAdmin = (req, res, next) => {
    // Added 'superadmin' so higher-level users aren't locked out of admin routes
    if (req.user && (req.user.role === 'admin' || req.user.role === 'lecturer' || req.user.role === 'superadmin')) {
        next();
    } else {
        res.status(403).json({ message: "Access denied. Admins/Lecturers only." });
    }
};

// Strict middleware for Super Admin Gate operations
const isSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'superadmin') {
        next();
    } else {
        res.status(403).json({ message: "Security clearance denied. Super Admins only." });
    }
};

module.exports = { protect, isAdmin, isSuperAdmin };