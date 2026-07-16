# Product Requirements

## Problem
Emul Ahamed Sazib needs a professional, self-hosted portfolio that presents his profile, skills, work experience, projects, and achievements to potential clients and employers, and lets them get in touch. Static resume sites are hard to keep current, so content must be data-driven and (where appropriate) editable via an admin dashboard.

## Goals
- Present a clear, scannable overview of who Emul is and what he can do.
- Let visitors review complete work experience, selected projects, skills, and achievements.
- Provide an easy contact path (form + direct email/phone).
- Keep content maintainable: dynamic sections served from APIs; some content managed through an admin panel; static profile data editable in one file.
- Look modern and polished with light/dark themes and responsive layout.

## Users & Personas
- **Recruiter / Hiring manager**: skims experience, skills, and projects to assess fit.
- **Potential client / founder**: evaluates capability and reaches out via the contact form.
- **Peer / collaborator**: browses projects, blog, and achievements.
- **Site owner (Emul)**: updates content via the admin dashboard and static data files.

## Functional Requirements
- Home page with sections: Summary, Skills, Work Experience, Projects, Achievements, Timeline, Contact.
- Dedicated pages: Projects, Achievements, Blog, Blog post, Admin, Admin login.
- REST APIs for summary, skills, projects, achievements, experience, timeline, blog, and contact.
- Contact form that submits to the backend.
- Light/dark theme toggle persisted in localStorage.
- Responsive navigation with mobile dropdown menu.
- Admin dashboard with authentication for managing DB-backed content.

## Non-Goals
- Multi-user accounts / public sign-up (admin-only auth).
- E-commerce, payments, or complex CMS features.
- Client-side SPA framework (intentionally vanilla JS).
- Internationalization / multi-language support (English only for now).

## Success Metrics
- Visitors can find experience, skills, and projects without confusion (clear section order).
- Contact form submissions are delivered reliably.
- Site loads fast and scores well on Lighthouse performance/accessibility.
- Owner can update content without touching layout code.
