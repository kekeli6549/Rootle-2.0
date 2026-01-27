// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // 1. Get token from the header (where React will send it later)
    const token = req.header('x-auth-token');

    // 2. Check if no token
    if (!token) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    // 3. Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Add the user info to the request object
        next(); // Move to the next step (the actual controller)
    } catch (err) {
        res.status(401).json({ message: "Token is not valid" });
    }
};