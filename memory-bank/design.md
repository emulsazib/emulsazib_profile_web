# Design

## Modules & Interfaces
- **Section pattern**: each home-page section is a static `<section class="panel">` shell in `index.html` with an empty container (id), filled by a `renderX(list)` function in `main.js`. Data arrives via `fetchJson(url)`.
- **APIs**: `GET /api/summary`, `/api/skills`, `/api/projects`, `/api/achievements`, `/api/experience`, `/api/timeline`, `/api/blog`; `POST /api/contact`; `/api/auth` for admin.
- **Static data API**: `app.js` returns `professionalSummary` at `/api/summary`, `{ experience }` at `/api/experience`, `{ timeline }` at `/api/timeline`.
- **Shared UI helpers**: `cardMedia()`, `projectCard()`, `achievementCard()`, `setupReadMore()`, radar chart builders for skills.

## Key Decisions
- Vanilla JS, multi-page (no SPA framework or bundler) for simplicity and speed.
- Split content sources: profile/summary/experience/timeline are static (edited in `staticData.js`); projects/skills/achievements/blog are DB-backed and admin-editable.
- Theme via `body[data-theme]` swapping CSS custom properties; preference saved in localStorage key `portfolio-theme`.
- Runtime migration safety net in `app.js` (`ensureMigrations`) since Vercel may inject `DATABASE_URL` only at runtime.

## Data Models
- **Summary**: `{ headline, blurb }`.
- **Experience item**: `{ role, company, companyUrl?, type, location, start, end, current, summary, highlights[], stack[] }`.
- **Timeline item**: `{ year, milestone }`.
- **Project** (DB): `{ title, description, stack[], image, link, github }`.
- **Skill** (DB): `{ name, category, level }`.
- **Achievement** (DB): `{ title, description, image, date }`.

## Conventions
- CSS: BEM-like `block`, `block__element`, `block--modifier` (e.g. `.panel__badge`, `.exp-item--current`).
- JS: camelCase; `renderX()` for DOM injection; template literals for markup.
- HTML ids: kebab-case (`experience-list`, `projects-grid`).
- Section badges numbered `NN • Name` in order: 01 Summary, 02 Skills, 03 Experience, 04 Projects, 05 Achievements, 06 Timeline, 07 Contact.
- Navigation markup duplicated per HTML page; shared behavior in `main.js`.

## Open Questions
- Should Work Experience move to a dedicated `/experience` page if the list grows long?
- Should experience become DB-backed + admin-managed like projects/skills?
- Should navigation be extracted into a shared partial to avoid per-page duplication?
