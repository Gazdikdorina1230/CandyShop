const admin = require('firebase-admin');

async function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;

        const userRecord = await admin.auth().getUser(decodedToken.uid);
        req.user.role = userRecord.customClaims?.role || 'user';

        next();
    } catch (error) {
        console.error('Token verification failed:', error);
        return res.status(403).json({ error: 'Forbidden: Invalid token' });
    }
}

function isAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ error: 'Forbidden: Admins only' });
}

module.exports = { authenticateToken, isAdmin };
