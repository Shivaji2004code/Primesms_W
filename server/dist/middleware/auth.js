"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireAuthWithRedirect = exports.requireAuth = void 0;
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
};
exports.requireAuth = requireAuth;
const requireAuthWithRedirect = (req, res, next) => {
    if (!req.session.user) {
        const isPageRoute = req.headers.accept?.includes('text/html');
        return isPageRoute
            ? res.redirect('/login')
            : res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    next();
};
exports.requireAuthWithRedirect = requireAuthWithRedirect;
const requireAdmin = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.session.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
exports.requireAdmin = requireAdmin;
//# sourceMappingURL=auth.js.map