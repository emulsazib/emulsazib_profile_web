// Create (or update) an admin account from environment variables.
//
// Secrets are read from the environment so they are never committed. Run it
// against your database, e.g.:
//
//   DATABASE_URL="<neon-pooled-url>" \
//   ADMIN_EMAIL="you@example.com" \
//   ADMIN_PASSWORD='your-password' \
//   npm run create-admin
//
// You then log in at /admin/login using the EMAIL as the username (the login
// form authenticates by username, and this sets username = email by default).
//
// Re-running with the same email updates the password (idempotent upsert), so
// it doubles as a password-reset tool. It never touches your other data.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool, query } = require('../backend/config/db');

async function main() {
  const email = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.toLowerCase().trim() : null;
  // Default the login username to the email so you can sign in with your email.
  const username = (process.env.ADMIN_USERNAME || email || '').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Super Admin';

  if (!process.env.DATABASE_URL) {
    console.error('✗ DATABASE_URL is not set.');
    process.exit(1);
  }
  if (!username || !password) {
    console.error('✗ Set ADMIN_PASSWORD and ADMIN_EMAIL (or ADMIN_USERNAME).');
    process.exit(1);
  }

  // Make sure the tables exist even if this runs before the seed.
  const schema = fs.readFileSync(path.join(__dirname, '..', 'backend', 'db', 'schema.sql'), 'utf8');
  await query(schema);

  const hash = await bcrypt.hash(password, 12);
  const { rows } = await query(
    `INSERT INTO admins (name, email, username, password)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (username) DO UPDATE
       SET password = EXCLUDED.password,
           email = EXCLUDED.email,
           name = EXCLUDED.name,
           updated_at = now()
     RETURNING id, name, email, username`,
    [name, email, username, hash]
  );

  console.log('✓ Admin ready — sign in at /admin/login with the username below:');
  console.log(rows[0]);
  await pool.end();
}

main().catch((err) => {
  console.error('✗ Failed to create admin:', err.message);
  process.exit(1);
});
