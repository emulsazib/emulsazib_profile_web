# Architecture

## Overview
A full-stack, multi-page web application. The frontend is plain HTML/CSS/ES-module JavaScript (no framework/bundler) served as static files by an Express 5 backend. Dynamic content is stored in PostgreSQL and exposed via REST APIs; profile/summary/experience/timeline content is served from a static data module. Deployable locally (`server.js`) and on Vercel serverless (`api/index.js`).

## Components
- **Frontend (`public/`)**: `index.html` (home with all sections) plus `projects.html`, `achievements.html`, `blog.html`, `blog-post.html`, `admin.html`, `admin-login.html`. Behavior in `public/scripts/*.js`; styles in `public/styles/main.css` and `admin.css`.
- **Backend (`backend/`)**: `app.js` builds the Express app, mounts middleware, static-data API routes, and routers. Routers in `backend/routes/` (auth, projects, skills, achievements, blog, contact, pages). Models in `backend/models/`. DB migrations in `backend/db/migrations/` run via `backend/db/migrate.js`.
- **Static data (`backend/data/staticData.js`)**: `professionalSummary`, `experience`, `timeline` objects/arrays.
- **Seed (`seed.js`)**: initial DB content.
- **Entry points**: `server.js` (local dev, port 4000), `api/index.js` (Vercel).

## Data Flow
1. Browser loads an HTML page; `main.js` runs on DOM ready.
2. On the home page, `hydrateFromApi()` fetches `/api/summary`, `/api/projects`, `/api/skills`, `/api/achievements`, `/api/experience`, `/api/timeline` in parallel.
3. `renderX()` functions build HTML via template literals and inject into container elements by id.
4. DB-backed routes query PostgreSQL through models; static routes return data from `staticData.js`.
5. Contact form POSTs JSON to `/api/contact`.
6. Admin dashboard authenticates via `/api/auth` then performs CRUD on DB content.

## Tech Stack
- Node.js + Express 5, `morgan`, `cors`, `express.json` (12mb limit for inline base64 images).
- PostgreSQL via `pg`.
- Vanilla HTML/CSS/JS (ES modules), Google Fonts (Space Grotesk, Inter).
- Vercel (serverless + Speed Insights), dotenv for config.

## External Dependencies
- PostgreSQL database (via `DATABASE_URL`).
- Vercel platform (hosting, speed insights, analytics scripts).
- Google Fonts CDN.
- npm packages: express, pg, morgan, cors, dotenv.
