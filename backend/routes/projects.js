const express = require('express');
const Project = require('../models/Project');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ── Public ──

// GET /api/projects
router.get('/', async (_req, res) => {
  try {
    const projects = await Project.find().lean();
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to load projects.' });
  }
});

// ── Admin CRUD (protected) ──

// POST /api/projects
router.post('/', requireAuth, async (req, res) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// PUT /api/projects/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!project) return res.status(404).json({ status: 'error', message: 'Project not found.' });
    res.json(project);
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ status: 'error', message: 'Project not found.' });
    res.json({ status: 'ok', message: 'Project deleted.' });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
