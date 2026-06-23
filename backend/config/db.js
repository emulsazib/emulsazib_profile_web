const { Pool } = require('pg');

// ── Cached connection pool ──
// Reused across serverless (warm) invocations to avoid exhausting Postgres
// connections. The pool connects lazily on the first query.
let pool = global._pgPool;

if (!pool) {
  pool = global._pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Neon (and most hosted Postgres) require SSL.
    ssl: { rejectUnauthorized: false },
    max: 5,
    // Neon scales to zero when idle; a cold start can take longer than 10s, so
    // allow generous headroom (mainly for the build-time migration step).
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 10000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected Postgres pool error:', err.message);
  });
}

const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
