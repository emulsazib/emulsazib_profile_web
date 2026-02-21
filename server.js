require('dotenv').config();
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const Project = require('./models/Project');
const Achievement = require('./models/Achievement');
const BlogPost = require('./models/BlogPost');
const Admin = require('./models/Admin');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me';

const app = express();
const PORT = process.env.PORT || 4000;

const professionalSummary = {
  headline: 'Product-minded Full-Stack Developer',
  blurb:
    'I help founders and teams ship delightful user experiences by combining thoughtful UX, performant frontends, and reliable APIs.',
};

const timeline = [
  {
    year: '2024',
    milestone: 'Led platform modernization for a sustainability startup, cutting render time by 42%.',
  },
  {
    year: '2023',
    milestone: 'Mentored 5 junior engineers and launched a design system adopted across 3 product teams.',
  },
  {
    year: '2022',
    milestone: 'Scaled an IoT analytics API to ingest 2B events/day with zero downtime migrations.',
  },
];

mongoose
  .connect(process.env.MONGODB_URI, { minHeartbeatFrequencyMS: 500 })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/summary', (_req, res) => {
  res.json(professionalSummary);
});

app.get('/api/projects', async (_req, res) => {
  try {
    const projects = await Project.find().lean();
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to load projects.' });
  }
});

app.get('/api/timeline', (_req, res) => {
  res.json({ timeline });
});

app.get('/api/achievements', async (_req, res) => {
  try {
    const achievements = await Achievement.find().lean();
    res.json({ achievements });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to load achievements.' });
  }
});

app.get('/api/blog', async (_req, res) => {
  try {
    const posts = await BlogPost.find({}, 'title excerpt author date tags').lean();
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to load blog posts.' });
  }
});

app.get('/api/blog/:id', async (req, res) => {
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

// ── Auth: Login ──

app.post('/api/auth/login', async (req, res) => {
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

app.get('/api/auth/verify', (req, res) => {
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

// ── Auth Middleware ──

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'Authentication required.' });
  }
  try {
    req.admin = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ status: 'error', message: 'Invalid or expired token.' });
  }
}

// ── Admin CRUD: Projects (protected) ──

app.post('/api/projects', requireAuth, async (req, res) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

app.put('/api/projects/:id', requireAuth, async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
    if (!project) return res.status(404).json({ status: 'error', message: 'Project not found.' });
    res.json(project);
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

app.delete('/api/projects/:id', requireAuth, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ status: 'error', message: 'Project not found.' });
    res.json({ status: 'ok', message: 'Project deleted.' });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// ── Admin CRUD: Achievements ──

app.post('/api/achievements', requireAuth, async (req, res) => {
  try {
    const achievement = await Achievement.create(req.body);
    res.status(201).json(achievement);
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

app.put('/api/achievements/:id', requireAuth, async (req, res) => {
  try {
    const achievement = await Achievement.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
    if (!achievement) return res.status(404).json({ status: 'error', message: 'Achievement not found.' });
    res.json(achievement);
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

app.delete('/api/achievements/:id', requireAuth, async (req, res) => {
  try {
    const achievement = await Achievement.findByIdAndDelete(req.params.id);
    if (!achievement) return res.status(404).json({ status: 'error', message: 'Achievement not found.' });
    res.json({ status: 'ok', message: 'Achievement deleted.' });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

// ── Admin CRUD: Blog Posts ──

app.post('/api/blog', requireAuth, async (req, res) => {
  try {
    const post = await BlogPost.create(req.body);
    res.status(201).json(post);
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

app.put('/api/blog/:id', requireAuth, async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
    if (!post) return res.status(404).json({ status: 'error', message: 'Blog post not found.' });
    res.json(post);
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

app.delete('/api/blog/:id', requireAuth, async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ status: 'error', message: 'Blog post not found.' });
    res.json({ status: 'ok', message: 'Blog post deleted.' });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

app.post('/api/contact', (req, res) => {
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

const htmlPages = ['projects', 'achievements', 'blog'];

htmlPages.forEach((page) => {
  app.get(`/${page}`, (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', `${page}.html`));
  });
});

app.get('/blog-post', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'blog-post.html'));
});

app.get('/admin/login', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get(/^\/(?!api).*/, (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Portfolio server ready on http://localhost:${PORT}`);
});
