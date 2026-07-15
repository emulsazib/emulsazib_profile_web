const express = require('express');
const Skill = require('../models/Skill');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ── Public ──

// GET /api/skills
router.get('/', async (_req, res) => {
  try {
    const skills = await Skill.findAll();
    res.json({ skills });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to load skills.' });
  }
});

// ── Admin CRUD (protected) ──

// POST /api/skills
router.post('/', requireAuth, async (req, res) => {
  try {
    const skill = await Skill.create(req.body);
    res.status(201).json(skill);
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// PUT /api/skills/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const skill = await Skill.update(req.params.id, req.body);
    if (!skill) return res.status(404).json({ status: 'error', message: 'Skill not found.' });
    res.json(skill);
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// DELETE /api/skills/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await Skill.remove(req.params.id);
    if (!deleted) return res.status(404).json({ status: 'error', message: 'Skill not found.' });
    res.json({ status: 'ok', message: 'Skill deleted.' });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
