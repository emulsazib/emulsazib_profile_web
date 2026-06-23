const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

module.exports = {
  async findByUsername(username) {
    const { rows } = await query('SELECT * FROM admins WHERE username = $1', [
      username.toLowerCase().trim(),
    ]);
    return rows[0] || null;
  },

  async create({ name = null, email = null, username, password }) {
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await query(
      `INSERT INTO admins (name, email, username, password)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO NOTHING
       RETURNING *`,
      [name, email ? email.toLowerCase().trim() : null, username.toLowerCase().trim(), hash]
    );
    return rows[0] || null;
  },

  comparePassword(candidate, hash) {
    return bcrypt.compare(candidate, hash);
  },
};
