-- 003_add_skills: skills with a proficiency level, powering the home-page
-- skills section (proficiency bars + a radar chart of per-category averages).
-- level is a 0–100 percentage. Safe to re-apply (IF NOT EXISTS).
CREATE TABLE IF NOT EXISTS skills (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  category    text NOT NULL DEFAULT 'General',
  level       integer NOT NULL DEFAULT 50 CHECK (level >= 0 AND level <= 100),
  created_at  timestamptz NOT NULL DEFAULT now()
);
