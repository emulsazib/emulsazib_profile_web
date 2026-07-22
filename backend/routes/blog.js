const express = require('express');
const BlogPost = require('../models/BlogPost');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Public (with optional auth) ──

// GET /api/blog
// Anonymous callers see published posts only. An authenticated admin (valid
// Bearer token) additionally sees drafts, so the dashboard lists everything.
router.get('/', optionalAuth, async (req, res) => {
  try {
    const posts = await BlogPost.findAll({ includeDrafts: !!req.admin });
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to load blog posts.' });
  }
});

// GET /api/blog/:idOrSlug
// Accepts either a UUID or a slug. Draft posts are only returned to an
// authenticated admin (enables draft preview); anonymous callers get a 404.
router.get('/:idOrSlug', optionalAuth, async (req, res) => {
  try {
    const key = req.params.idOrSlug;
    const post = UUID_RE.test(key)
      ? await BlogPost.findById(key)
      : await BlogPost.findBySlug(key);
    if (!post || (post.status !== 'published' && !req.admin)) {
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
    const post = await BlogPost.update(req.params.id, req.body);
    if (!post) return res.status(404).json({ status: 'error', message: 'Blog post not found.' });
    res.json(post);
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// DELETE /api/blog/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await BlogPost.remove(req.params.id);
    if (!deleted) return res.status(404).json({ status: 'error', message: 'Blog post not found.' });
    res.json({ status: 'ok', message: 'Blog post deleted.' });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
