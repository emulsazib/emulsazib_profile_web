const path = require('path');
const express = require('express');

const router = express.Router();

const publicDir = path.join(__dirname, '..', '..', 'public');

const htmlPages = ['projects', 'achievements', 'blog'];

htmlPages.forEach((page) => {
  router.get(`/${page}`, (_req, res) => {
    res.sendFile(path.join(publicDir, `${page}.html`));
  });
});

router.get('/blog-post', (_req, res) => {
  res.sendFile(path.join(publicDir, 'blog-post.html'));
});

router.get('/admin/login', (_req, res) => {
  res.sendFile(path.join(publicDir, 'admin-login.html'));
});

router.get('/admin', (_req, res) => {
  res.sendFile(path.join(publicDir, 'admin.html'));
});

router.get('/', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Catch-all: serve index.html for any non-API route
router.get(/^\/(?!api).*/, (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

module.exports = router;
