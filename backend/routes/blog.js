const express = require('express');
const BlogPost = require('../models/BlogPost');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ── Public ──

// GET /api/blog
router.get('/', async (_req, res) => {
  try {
    const posts = await BlogPost.find({}, 'title excerpt author date tags').lean();
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to load blog posts.' });
  }
});

// GET /api/blog/:id
router.get('/:id', async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id).lean();
    if (!post) {
      return res.status(404).json({ status: 'error', message: 'Blog post not found.' });
    }
    res.json(post);
  } catch (err) {
    res.status(404).json({ status: 'error', message: 'Blog post not found.' });
  }
});

// ── Admin CRUD (protected) ──

// POST /api/blog
router.post('/', requireAuth, async (req, res) => {
  try {
    const post = await BlogPost.create(req.body);
    res.status(201).json(post);
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// PUT /api/blog/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!post) return res.status(404).json({ status: 'error', message: 'Blog post not found.' });
    res.json(post);
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// DELETE /api/blog/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ status: 'error', message: 'Blog post not found.' });
    res.json({ status: 'ok', message: 'Blog post deleted.' });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
