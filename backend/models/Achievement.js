const { query } = require('../config/db');

// Map a DB row to the API shape the frontend expects (id -> _id).
const toApi = (r) =>
  r && {
    _id: r.id,
    title: r.title,
    description: r.description,
    image: r.image,
    date: r.date,
  };

module.exports = {
  async findAll() {
    const { rows } = await query('SELECT * FROM achievements ORDER BY created_at DESC');
    return rows.map(toApi);
  },

  async create(b) {
    const { rows } = await query(
      `INSERT INTO achievements (title, description, image, date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [b.title, b.description, b.image || null, b.date || null]
    );
    return toApi(rows[0]);
  },

  async update(id, b) {
    const { rows } = await query(
      `UPDATE achievements
         SET title = $2, description = $3, image = $4, date = $5
       WHERE id = $1
       RETURNING *`,
      [id, b.title, b.description, b.image || null, b.date || null]
    );
    return toApi(rows[0]);
  },

  async remove(id) {
    const { rowCount } = await query('DELETE FROM achievements WHERE id = $1', [id]);
    return rowCount > 0;
  },
};
