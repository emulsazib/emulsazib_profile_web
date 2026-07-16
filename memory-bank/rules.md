# Rules

## Must Do
- Follow the section pattern for new home sections: HTML `panel` shell + empty container id, a `renderX()` function in `main.js`, and reuse existing CSS classes.
- Keep section badge numbering sequential and update all downstream badges when inserting a section.
- Edit profile/summary/experience/timeline content in `backend/data/staticData.js`; expose new static content via an `/api/*` route in `backend/app.js`.
- Support both light and dark themes using existing CSS custom properties.
- Run `ReadLints` and verify modules load (`node -e require(...)`) after backend edits.
- Keep API responses shaped consistently (e.g. `{ experience }`, `{ timeline }`, `{ projects }`).

## Must Not Do
- Do not introduce a frontend framework (React/Vue) or a bundler; stay vanilla ES modules.
- Do not hardcode secrets or commit `.env` / credentials.
- Do not commit changes unless explicitly asked.
- Do not break the mobile nav clone logic or the theme localStorage key `portfolio-theme`.

## Coding Standards
- CSS: BEM-like naming (`block__element`, `block--modifier`); use CSS variables for colors/theming.
- JS: camelCase functions, `renderX()` for DOM injection, template literals for markup, guard against null containers.
- HTML ids: kebab-case. Keep markup accessible (`aria-live`, `aria-label`, `alt`).
- Match existing formatting; avoid narrating comments.

## Guardrails
- Static API routes must not depend on the database (they power the site even without `DATABASE_URL`).
- Preserve the `ensureMigrations` runtime safety net in `app.js`.
- Keep body JSON limit generous (12mb) for inline base64 images.
- Test endpoints locally on port 4000 before relying on them.
