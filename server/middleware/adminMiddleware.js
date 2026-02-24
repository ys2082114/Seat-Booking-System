/**
 * adminMiddleware.js
 * Must be used AFTER authMiddleware (which sets req.user).
 * Blocks requests from non-ADMIN users with 403 Forbidden.
 */
module.exports = function adminMiddleware(req, res, next) {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Admin access required.' });
    }
    next();
};
