const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me';

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'Authentication required.' });
  }
  try {
    req.admin = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ status: 'error', message: 'Invalid or expired token.' });
  }
}

// Non-throwing variant: attaches req.admin when a valid Bearer token is present,
// but never blocks the request. Lets public endpoints reveal extra data (e.g.
// draft posts) to authenticated admins while staying open to everyone else.
function optionalAuth(req, _res, next) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    try {
      req.admin = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    } catch {
      // Invalid/expired token — treat as anonymous rather than erroring.
    }
  }
  next();
}

module.exports = { requireAuth, optionalAuth, JWT_SECRET };
