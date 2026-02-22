const path = require('path');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

// ── Route imports ──
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const achievementRoutes = require('./routes/achievements');
const blogRoutes = require('./routes/blog');
const contactRoutes = require('./routes/contact');
const pageRoutes = require('./routes/pages');

// ── Static data imports ──
const { professionalSummary, timeline } = require('./data/staticData');

const app = express();

// ── Global middleware ──
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── Static data API routes ──
app.get('/api/summary', (_req, res) => {
  res.json(professionalSummary);
});

app.get('/api/timeline', (_req, res) => {
  res.json({ timeline });
});

// ── Mount routers ──
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/contact', contactRoutes);

// ── HTML page routes (must be last) ──
app.use('/', pageRoutes);

module.exports = app;
