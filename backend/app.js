const path = require('path');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

// ── Route imports ──
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const skillRoutes = require('./routes/skills');
const achievementRoutes = require('./routes/achievements');
const blogRoutes = require('./routes/blog');
const contactRoutes = require('./routes/contact');
const pageRoutes = require('./routes/pages');

// ── Static data imports ──
const { professionalSummary, experience, timeline } = require('./data/staticData');
const { runMigrations } = require('./db/migrate');

const app = express();

// ── Global middleware ──
app.use(morgan('dev'));
app.use(cors());
// Base64-encoded images (stored inline in Postgres) are sent as JSON, so the
// default 100kb body limit would reject them. Allow generous headroom.
app.use(express.json({ limit: '12mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── Runtime migration safety net ──
// The build-time migration (npm run vercel-build) is skipped when DATABASE_URL
// isn't present in the *build* environment — a common Vercel setup where the DB
// URL is only injected at runtime. That can leave the live schema missing newer
// columns (e.g. projects.image). So, before serving any API request, apply
// pending migrations once per running instance. runMigrations() is idempotent
// and the promise is cached, so warm requests just await a resolved promise.
let migrationsReady = null;
function ensureMigrations() {
  if (!process.env.DATABASE_URL) return Promise.resolve();
  if (!migrationsReady) {
    migrationsReady = runMigrations().catch((err) => {
      migrationsReady = null; // reset so the next request retries
      throw err;
    });
  }
  return migrationsReady;
}

app.use('/api', (req, res, next) => {
  ensureMigrations().then(() => next()).catch(next);
});

// ── Static data API routes ──
app.get('/api/summary', (_req, res) => {
  res.json(professionalSummary);
});

app.get('/api/experience', (_req, res) => {
  res.json({ experience });
});

app.get('/api/timeline', (_req, res) => {
  res.json({ timeline });
});

// ── Mount routers ──
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/contact', contactRoutes);

// ── HTML page routes (must be last) ──
app.use('/', pageRoutes);

// ── Error handler ──
// Guarantees the serverless function always responds instead of crashing
// (a FUNCTION_INVOCATION_FAILED on Vercel) when a handler throws.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) return;
  res.status(500).json({ status: 'error', message: 'Internal server error.' });
});

module.exports = app;
