-- 002_add_project_image: give projects an image, stored in the database.
-- The column holds either a Base64 data URL (image uploaded via the admin
-- panel and stored inline in Postgres) or a plain URL/path. Nullable so
-- existing rows and image-less projects remain valid.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS image text;
