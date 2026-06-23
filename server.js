require('dotenv').config();

const app = require('./backend/app');
const { pool } = require('./backend/config/db');

const PORT = process.env.PORT || 4000;

// ── Non-blocking DB connectivity check (the pool itself connects lazily) ──
pool
  .query('SELECT 1')
  .then(() => console.log('Connected to PostgreSQL'))
  .catch((err) => console.error('PostgreSQL connection warning:', err.message));

app.listen(PORT, () => {
  console.log(`Portfolio server ready on http://localhost:${PORT}`);
});
