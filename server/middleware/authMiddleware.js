// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // 1. Get token from the header
    const token = req.header('x-auth-token');

    // 2. Check if no token
    if (!token) {
        return res.status(401).json({ message: "No token, access denied. Please login first." });
    }

    // 3. Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Add the user info (id and role) to the request object
        req.user = decoded; 
        
        next(); // Move to the resourceController.uploadResource
    } catch (err) {
        console.error("Token verification failed:", err.message);
        res.status(401).json({ message: "Session expired or invalid token. Log in again." });
    }
};