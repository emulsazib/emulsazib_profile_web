const { query } = require('../config/db');

// Full post (includes content) — matches the single-post API shape.
const toApi = (r) =>
  r && {
    _id: r.id,
    title: r.title,
    excerpt: r.excerpt,
    content: r.content,
    author: r.author,
    date: r.date,
    tags: r.tags || [],
  };

// List item (no content) — matches the list API shape.
const toListApi = (r) =>
  r && {
    _id: r.id,
    title: r.title,
    excerpt: r.excerpt,
    author: r.author,
    date: r.date,
    tags: r.tags || [],
  };

module.exports = {
  async findAll() {
    const { rows } = await query(
      `SELECT id, title, excerpt, author, date, tags
         FROM blog_posts
       ORDER BY created_at DESC`
    );
    return rows.map(toListApi);
  },

  async findById(id) {
    const { rows } = await query('SELECT * FROM blog_posts WHERE id = $1', [id]);
    return toApi(rows[0]);
  },

  async create(b) {
    const { rows } = await query(
      `INSERT INTO blog_posts (title, excerpt, content, author, date, tags)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [b.title, b.excerpt, b.content, b.author, b.date || null, b.tags || []]
    );
    return toApi(rows[0]);
  },

  async update(id, b) {
    const { rows } = await query(
      `UPDATE blog_posts
         SET title = $2, excerpt = $3, content = $4, author = $5, date = $6, tags = $7
       WHERE id = $1
       RETURNING *`,
      [id, b.title, b.excerpt, b.content, b.author, b.date || null, b.tags || []]
    );
    return toApi(rows[0]);
  },

  async remove(id) {
    const { rowCount } = await query('DELETE FROM blog_posts WHERE id = $1', [id]);
    return rowCount > 0;
  },
};
