// server/middleware/adminMiddleware.js

module.exports = (req, res, next) => {
    // We already have req.user from the first middleware
    if (req.user && req.user.role === 'admin') {
        next(); // They are an admin, let them pass!
    } else {
        return res.status(403).json({ message: "Access denied. Admins only." });
    }
};