const { query } = require('../config/db');

// Map a DB row to the API shape the frontend expects (id -> _id).
const toApi = (r) =>
  r && {
    _id: r.id,
    name: r.name,
    category: r.category,
    level: r.level,
  };

// Coerce arbitrary input into a valid 0–100 integer level.
const clampLevel = (v) => {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return 50;
  return Math.max(0, Math.min(100, n));
};

const cleanCategory = (v) => {
  const s = (v || '').trim();
  return s || 'General';
};

module.exports = {
  async findAll() {
    // Grouped by category, strongest first — matches how the UI lays them out.
    const { rows } = await query(
      'SELECT * FROM skills ORDER BY category ASC, level DESC, name ASC'
    );
    return rows.map(toApi);
  },

  async create(b) {
    const { rows } = await query(
      `INSERT INTO skills (name, category, level)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [b.name, cleanCategory(b.category), clampLevel(b.level)]
    );
    return toApi(rows[0]);
  },

  async update(id, b) {
    const { rows } = await query(
      `UPDATE skills
         SET name = $2, category = $3, level = $4
       WHERE id = $1
       RETURNING *`,
      [id, b.name, cleanCategory(b.category), clampLevel(b.level)]
    );
    return toApi(rows[0]);
  },

  async remove(id) {
    const { rowCount } = await query('DELETE FROM skills WHERE id = $1', [id]);
    return rowCount > 0;
  },
};
