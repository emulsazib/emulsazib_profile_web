const { query } = require('../config/db');

// Map a DB row to the API shape the frontend expects (id -> _id).
const toApi = (r) =>
  r && {
    _id: r.id,
    title: r.title,
    stack: r.stack || [],
    description: r.description,
    link: r.link,
    github: r.github,
  };

module.exports = {
  async findAll() {
    const { rows } = await query('SELECT * FROM projects ORDER BY created_at DESC');
    return rows.map(toApi);
  },

  async create(b) {
    const { rows } = await query(
      `INSERT INTO projects (title, stack, description, link, github)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [b.title, b.stack || [], b.description, b.link || null, b.github || null]
    );
    return toApi(rows[0]);
  },

  async update(id, b) {
    const { rows } = await query(
      `UPDATE projects
         SET title = $2, stack = $3, description = $4, link = $5, github = $6
       WHERE id = $1
       RETURNING *`,
      [id, b.title, b.stack || [], b.description, b.link || null, b.github || null]
    );
    return toApi(rows[0]);
  },

  async remove(id) {
    const { rowCount } = await query('DELETE FROM projects WHERE id = $1', [id]);
    return rowCount > 0;
  },
};
