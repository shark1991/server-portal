function requireAuth(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect('/?return_to=' + encodeURIComponent(req.originalUrl));
    }
    next();
}

function requireAdmin(req, res, next) {
    if (!req.session || !req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Forbidden');
    }
    next();
}

function requireApproved(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect('/?return_to=' + encodeURIComponent(req.originalUrl));
    }
    if (req.session.user.status !== 'approved') {
        return res.status(403).send('Account pending approval');
    }
    next();
}

module.exports = {
    requireAuth,
    requireAdmin,
    requireApproved
};