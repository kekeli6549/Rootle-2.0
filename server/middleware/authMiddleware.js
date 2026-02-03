const jwt = require('jsonwebtoken');

/**
 * Standard Auth: Verify if the user is logged in at all.
 * This is the first gate.
 */
const protect = (req, res, next) => {
    const token = req.header('x-auth-token');
    
    if (!token) {
        return res.status(401).json({ message: "No token, access denied." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Attach the user data (id, role, etc.) to the request object
        req.user = decoded; 
        next();
    } catch (err) {
        console.error("JWT Verification Error:", err.message);
        res.status(401).json({ message: "Session expired or invalid token." });
    }
};

/**
 * Staff Auth: Verify if the user has elevated privileges.
 * Allows both 'admin' and 'lecturer' roles to access management routes.
 */
const isAdmin = (req, res, next) => {
    // Check if user exists and if their role is either admin or lecturer
    const authorizedRoles = ['admin', 'lecturer'];

    if (req.user && authorizedRoles.includes(req.user.role)) {
        next();
    } else {
        // Log the attempted access for security monitoring
        console.warn(`🛑 Unauthorized Access Attempt by User: ${req.user?.id} with role: ${req.user?.role}`);
        res.status(403).json({ 
            message: "Access denied. You do not have the clearance for this level." 
        });
    }
};

module.exports = { protect, isAdmin };