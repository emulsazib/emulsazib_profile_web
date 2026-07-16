# Memory

## Summary
Personal portfolio for Emul Ahamed Sazib: Express 5 backend serving a vanilla HTML/CSS/JS multi-page frontend, PostgreSQL for dynamic content (projects/skills/achievements/blog) and a static data module for profile/summary/experience/timeline. Deployed via Vercel. knbase governance was initialized for this project.

## Recent Changes
- Added Work Experience feature: `experience` array in `backend/data/staticData.js`, `GET /api/experience` in `backend/app.js`, `03 • Experience` section in `public/index.html` (subsequent badges renumbered to 04-07), `renderExperience()`/`experienceItem()` in `public/scripts/main.js`, and `.exp-item` vertical-timeline styles in `public/styles/main.css`.
- Verified `/api/experience` returns data locally (server runs on port 4000).
- Fixed knbase: `~/.cursor/mcp.json` `KNBASE_ROOT` was the placeholder `/absolute/path/to/your/project`; set to `/Users/emulsazib/Downloads/emulsazib_profile_web`.
- Bootstrapped all six knbase governance docs.

## Learnings & Gotchas
- The knbase MCP server uses the configured `KNBASE_ROOT` env (from `~/.cursor/mcp.json`); the per-call `root` argument does not override it for session/bootstrap operations.
- knbase docs live in the project's `memory-bank/` directory; `begin_task` is blocked until all six docs exist, and `complete_task` requires `memory.md` to be updated during the task.
- Local dev server (`server.js`) listens on port 4000, not 3000.
- Work Experience entries are currently realistic placeholders and need real data.

## Known Issues
- Work Experience content is placeholder pending real roles/dates.
- Navigation markup is duplicated across HTML pages (no shared partial).
- Some DB-backed sections may still contain seed/placeholder content.
