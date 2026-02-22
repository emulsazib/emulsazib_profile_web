const express = require('express');
const Achievement = require('../models/Achievement');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ── Public ──

// GET /api/achievements
router.get('/', async (_req, res) => {
  try {
    const achievements = await Achievement.find().lean();
    res.json({ achievements });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to load achievements.' });
  }
});

// ── Admin CRUD (protected) ──

// POST /api/achievements
router.post('/', requireAuth, async (req, res) => {
  try {
    const achievement = await Achievement.create(req.body);
    res.status(201).json(achievement);
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// PUT /api/achievements/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const achievement = await Achievement.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!achievement) return res.status(404).json({ status: 'error', message: 'Achievement not found.' });
    res.json(achievement);
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// DELETE /api/achievements/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const achievement = await Achievement.findByIdAndDelete(req.params.id);
    if (!achievement) return res.status(404).json({ status: 'error', message: 'Achievement not found.' });
    res.json({ status: 'ok', message: 'Achievement deleted.' });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
