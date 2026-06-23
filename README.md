# Portfolio

A modern full-stack portfolio that pairs an Express backend with a responsive frontend. The site showcases projects, timeline milestones, and a contact workflow that all hydrate from backend APIs while providing an accessible light/dark theme toggle.

## Tech Stack

- **Frontend:** Vanilla HTML, CSS (custom design system), JavaScript modules
- **Backend:** Express.js with REST endpoints (`/api/summary`, `/api/projects`, `/api/achievements`, `/api/blog`, `/api/timeline`, `/api/contact`)
- **Database:** PostgreSQL via the `pg` driver (uses a cached connection pool)
- **Tooling:** Nodemon for local dev, modern CSS layout primitives, fetch-based API consumption

## Getting Started

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL and JWT_SECRET
npm run seed           # creates tables + seeds sample content + default admin
npm run dev            # starts nodemon on http://localhost:4000
# or
npm start              # production-style start
```

The Express server serves the static frontend from `public/` and exposes API data that the UI consumes at runtime. Dark/light mode preferences persist via `localStorage`.

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (use a **pooled** URL with `sslmode=require` for serverless). |
| `JWT_SECRET` | Yes (prod) | Secret used to sign admin JWTs. |
| `PORT` | No | Local dev port; defaults to `4000` (Vercel sets this automatically). |

The default admin created by `npm run seed` is **username: `admin`, password: `admin123`** — change it for any real deployment.

## Customization

- Update `seed.js` (or the admin dashboard at `/admin`) to adjust project data, achievements, and blog posts.
- Edit static summary/timeline content in `backend/data/staticData.js`.
- Add images to `public/images/` and reference them from the HTML pages.
- Extend styling in `public/styles/main.css` using the defined CSS variables (e.g., `--accent`, `--bg`).

## Deploy to Vercel + Neon

This repo is configured to run on Vercel as a serverless function:

- `api/index.js` exports the Express app as the function handler.
- `vercel.json` rewrites all non-static requests to that function; `public/` assets are served from Vercel's CDN.

Steps:

1. **Provision Postgres on [Neon](https://neon.tech).** Create a project and copy the **pooled** connection string (host contains `-pooler`, includes `sslmode=require`).
2. **Import the repo into Vercel** (or add Neon via the Vercel integration, which sets `DATABASE_URL` automatically).
3. **Set environment variables** in the Vercel project: `DATABASE_URL` and `JWT_SECRET`.
4. **Seed the database once** against Neon (from your machine):
   ```bash
   DATABASE_URL="<neon-pooled-url>" JWT_SECRET="<secret>" npm run seed
   ```
5. **Deploy.** Static pages, the `/api/*` endpoints, and the admin dashboard (`/admin`) will all be served by the single function.

Any other Node-friendly host (Render, Railway, Fly.io, etc.) can also run this repo via `npm start`; set `DATABASE_URL`, `JWT_SECRET`, and `PORT` as needed.
