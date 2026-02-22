const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ status: 'error', message: 'Username and password are required.' });
    }
    const admin = await Admin.findOne({ username: username.toLowerCase().trim() });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ status: 'error', message: 'Invalid username or password.' });
    }
    const token = jwt.sign({ id: admin._id, username: admin.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ status: 'ok', token, username: admin.username });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Login failed.' });
  }
});

// GET /api/auth/verify
router.get('/verify', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'No token provided.' });
  }
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    res.json({ status: 'ok', username: decoded.username });
  } catch {
    res.status(401).json({ status: 'error', message: 'Invalid or expired token.' });
  }
});

module.exports = router;
