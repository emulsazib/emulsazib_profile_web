// CLI entry for running database migrations.
//
// Runs automatically on every Vercel deploy via the "vercel-build" npm script,
// and can be run locally with `npm run migrate`.
//
// If DATABASE_URL is not set we skip (exit 0) rather than failing the build, so
// a deploy made before the database is configured still succeeds. Once the URL
// is set, any real migration error fails the build (and keeps the previous
// working deploy live) instead of shipping code against an un-migrated schema.

require('dotenv').config();
const { pool } = require('../backend/config/db');
const { runMigrations } = require('../backend/db/migrate');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠ DATABASE_URL not set — skipping migrations.');
    return;
  }
  await runMigrations();
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error('✗', err.message);
    process.exit(1);
  });
