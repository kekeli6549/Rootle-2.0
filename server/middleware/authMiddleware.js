const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    const token = req.header('x-auth-token');
    
    if (!token) {
        return res.status(401).json({ message: "No token, access denied." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            id: decoded.id,
            role: decoded.role,
            department_id: decoded.department_id 
        }; 
        next();
    } catch (err) {
        res.status(401).json({ message: "Session expired or invalid token." });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'lecturer')) {
        next();
    } else {
        res.status(403).json({ message: "High-level clearance required." });
    }
};

module.exports = { protect, isAdmin };