-- Schema for the portfolio app (PostgreSQL).
-- gen_random_uuid() is built into Postgres 13+ (no extension required on Neon).

CREATE TABLE IF NOT EXISTS projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  stack       text[] NOT NULL DEFAULT '{}',
  description text NOT NULL,
  link        text,
  github      text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS achievements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text NOT NULL,
  image       text,
  date        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  excerpt     text NOT NULL,
  content     text NOT NULL,
  author      text NOT NULL,
  date        text,
  tags        text[] NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admins (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text,
  email       text UNIQUE,
  username    text UNIQUE NOT NULL,
  password    text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
