-- 004_blog_editor_seo: upgrade blog_posts for the WordPress-style editor.
-- Adds a rich-HTML content path, SEO metadata, taxonomy, a featured image,
-- and a draft/publish workflow. Every column is added with IF NOT EXISTS and a
-- safe default so existing rows stay valid and publicly visible.

-- Human-friendly URL segment. Nullable: legacy posts keep working by UUID until
-- their next save (which backfills a slug). A partial unique index (below)
-- enforces uniqueness only across non-null slugs.
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS slug text;

-- 'markdown' = legacy pseudo-Markdown parsed client-side; 'html' = rich HTML
-- emitted by the Quill editor and rendered (sanitized) directly. Existing rows
-- default to 'markdown' so the old renderer keeps handling them.
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content_format text NOT NULL DEFAULT 'markdown';

-- SEO metadata.
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_title text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_description text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS focus_keyword text;

-- Featured image: Base64 data URL or plain URL, same convention as projects.image.
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS featured_image text;

-- Taxonomy (tags already exist as a text[]; categories are the coarser bucket).
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS categories text[] NOT NULL DEFAULT '{}';

-- Publishing workflow. Existing rows default to 'published' so nothing hides.
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';

-- Cached SEO score (0-100) computed in the editor and stored for reference.
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS seo_score integer;

-- Last-modified timestamp (created_at already exists).
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Uniqueness only among posts that actually have a slug.
CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_key
  ON blog_posts (slug) WHERE slug IS NOT NULL;
