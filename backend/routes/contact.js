const express = require('express');

const router = express.Router();

// POST /api/contact
router.post('/', (req, res) => {
  const { name, email, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({
      status: 'error',
      message: 'Name, email, and message are required.',
    });
  }

  res.status(201).json({
    status: 'ok',
    message: 'Thanks for reaching out — your note is en route!',
  });
});

module.exports = router;
