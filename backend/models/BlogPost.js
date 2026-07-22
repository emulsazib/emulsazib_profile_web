const { query } = require('../config/db');

// Full post (includes content) — matches the single-post API shape.
const toApi = (r) =>
  r && {
    _id: r.id,
    title: r.title,
    slug: r.slug,
    excerpt: r.excerpt,
    content: r.content,
    contentFormat: r.content_format || 'markdown',
    author: r.author,
    date: r.date,
    tags: r.tags || [],
    categories: r.categories || [],
    featuredImage: r.featured_image || '',
    metaTitle: r.meta_title || '',
    metaDescription: r.meta_description || '',
    focusKeyword: r.focus_keyword || '',
    status: r.status || 'published',
    seoScore: r.seo_score == null ? null : Number(r.seo_score),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };

// List item (no content) — matches the list API shape.
const toListApi = (r) =>
  r && {
    _id: r.id,
    title: r.title,
    slug: r.slug,
    excerpt: r.excerpt,
    author: r.author,
    date: r.date,
    tags: r.tags || [],
    categories: r.categories || [],
    featuredImage: r.featured_image || '',
    status: r.status || 'published',
    seoScore: r.seo_score == null ? null : Number(r.seo_score),
  };

// Turn a title (or explicit slug) into a URL-safe segment.
function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// Produce a slug that is unique across the table, appending -2, -3, … on clash.
// `excludeId` lets a post keep its own slug during an update.
async function uniqueSlug(base, excludeId = null) {
  let candidate = slugify(base) || 'post';
  let n = 1;
  // Loop until no other row owns the candidate slug.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { rows } = await query(
      'SELECT id FROM blog_posts WHERE slug = $1 AND ($2::uuid IS NULL OR id <> $2) LIMIT 1',
      [candidate, excludeId]
    );
    if (rows.length === 0) return candidate;
    n += 1;
    candidate = `${slugify(base) || 'post'}-${n}`;
  }
}

// Normalize an incoming payload into DB columns, filling sensible defaults.
function normalize(b) {
  return {
    title: b.title,
    excerpt: b.excerpt,
    content: b.content,
    content_format: b.contentFormat === 'html' ? 'html' : b.content_format || 'markdown',
    author: b.author,
    date: b.date || null,
    tags: Array.isArray(b.tags) ? b.tags : [],
    categories: Array.isArray(b.categories) ? b.categories : [],
    featured_image: b.featuredImage || b.featured_image || null,
    meta_title: b.metaTitle || b.meta_title || null,
    meta_description: b.metaDescription || b.meta_description || null,
    focus_keyword: b.focusKeyword || b.focus_keyword || null,
    status: b.status === 'draft' ? 'draft' : 'published',
    seo_score:
      b.seoScore == null || b.seoScore === '' ? null : Math.round(Number(b.seoScore)),
  };
}

module.exports = {
  slugify,

  async findAll({ includeDrafts = false } = {}) {
    const { rows } = await query(
      `SELECT id, title, slug, excerpt, author, date, tags, categories,
              featured_image, status, seo_score
         FROM blog_posts
        WHERE $1 = true OR status = 'published'
        ORDER BY created_at DESC`,
      [includeDrafts]
    );
    return rows.map(toListApi);
  },

  async findById(id) {
    const { rows } = await query('SELECT * FROM blog_posts WHERE id = $1', [id]);
    return toApi(rows[0]);
  },

  async findBySlug(slug) {
    const { rows } = await query('SELECT * FROM blog_posts WHERE slug = $1', [slug]);
    return toApi(rows[0]);
  },

  async create(b) {
    const n = normalize(b);
    const slug = await uniqueSlug(b.slug || b.title);
    const { rows } = await query(
      `INSERT INTO blog_posts
         (title, slug, excerpt, content, content_format, author, date, tags,
          categories, featured_image, meta_title, meta_description,
          focus_keyword, status, seo_score)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        n.title, slug, n.excerpt, n.content, n.content_format, n.author, n.date,
        n.tags, n.categories, n.featured_image, n.meta_title, n.meta_description,
        n.focus_keyword, n.status, n.seo_score,
      ]
    );
    return toApi(rows[0]);
  },

  async update(id, b) {
    const n = normalize(b);
    const slug = await uniqueSlug(b.slug || b.title, id);
    const { rows } = await query(
      `UPDATE blog_posts SET
         title = $2, slug = $3, excerpt = $4, content = $5, content_format = $6,
         author = $7, date = $8, tags = $9, categories = $10, featured_image = $11,
         meta_title = $12, meta_description = $13, focus_keyword = $14,
         status = $15, seo_score = $16, updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [
        id, n.title, slug, n.excerpt, n.content, n.content_format, n.author,
        n.date, n.tags, n.categories, n.featured_image, n.meta_title,
        n.meta_description, n.focus_keyword, n.status, n.seo_score,
      ]
    );
    return toApi(rows[0]);
  },

  async remove(id) {
    const { rowCount } = await query('DELETE FROM blog_posts WHERE id = $1', [id]);
    return rowCount > 0;
  },
};
