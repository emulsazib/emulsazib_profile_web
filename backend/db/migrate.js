const fs = require('fs');
const path = require('path');
const { pool, query } = require('../config/db');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

// Applies every *.sql file in ./migrations that hasn't been applied yet, in
// filename order, each inside its own transaction. Already-applied migrations
// are tracked in the _migrations table, so this is safe to run on every deploy:
// pending migrations apply once, and re-runs are no-ops.
//
// To add a schema change: drop a new file in backend/db/migrations/ named with
// the next number, e.g. 002_add_published_flag.sql. It applies on the next push.
async function runMigrations() {
  await query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name       text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const { rows } = await query('SELECT name FROM _migrations');
  const applied = new Set(rows.map((r) => r.name));

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`✓ applied migration ${file}`);
      count++;
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Migration ${file} failed: ${err.message}`);
    } finally {
      client.release();
    }
  }

  if (count === 0) console.log('✓ database already up to date');
  else console.log(`✓ applied ${count} migration(s)`);
}

module.exports = { runMigrations };
