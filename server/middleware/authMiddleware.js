const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
    // Look for token in x-auth-token header
    const token = req.header('x-auth-token');

    if (!token) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: "Token is not valid" });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'lecturer')) {
        next();
    } else {
        res.status(403).json({ message: "Access denied. Admins/Lecturers only." });
    }
};

module.exports = { protect, isAdmin };