const body = document.body;
const themeToggle = document.getElementById('theme-toggle');
const projectsGrid = document.getElementById('projects-grid');
const skillsGroups = document.getElementById('skills-groups');
const skillsRadar = document.getElementById('skills-radar');
const achievementsGrid = document.getElementById('achievements-grid');
const experienceList = document.getElementById('experience-list');
const timelineList = document.getElementById('timeline-list');
const summaryHeadline = document.getElementById('summary-headline');
const summaryBlurb = document.getElementById('summary-blurb');
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');
const YEAR = document.getElementById('year');
const SCROLL_BTNS = document.querySelectorAll('[data-scroll]');

const STORAGE_KEY = 'portfolio-theme';
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

init();

function init() {
  if (YEAR) YEAR.textContent = new Date().getFullYear();
  initTheme();
  initMobileMenu();
  wireNavigation();
  highlightActiveNav();
  if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    hydrateFromApi();
    initForm();
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEY);
  const initialTheme = savedTheme || (prefersDark.matches ? 'dark' : 'light');
  setTheme(initialTheme);
  prefersDark.addEventListener('change', (event) => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setTheme(event.matches ? 'dark' : 'light');
    }
  });
  themeToggle?.addEventListener('click', () => {
    const nextTheme = body.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem(STORAGE_KEY, nextTheme);
  });
}

function setTheme(theme) {
  body.dataset.theme = theme;
}

function initMobileMenu() {
  const menuToggle = document.getElementById('menu-toggle');
  const navActions = document.getElementById('nav-actions');
  const nav = document.querySelector('.nav');
  if (!menuToggle || !navActions || !nav) return;

  let overlay = document.querySelector('.nav-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);
  }

  // Clone nav links into body so backdrop-filter on .nav doesn't trap fixed positioning
  let mobileMenu = document.getElementById('mobile-menu');
  if (!mobileMenu) {
    mobileMenu = navActions.cloneNode(true);
    mobileMenu.id = 'mobile-menu';
    mobileMenu.className = 'mobile-dropdown';
    document.body.appendChild(mobileMenu);
  }

  function positionDropdown() {
    const rect = nav.getBoundingClientRect();
    mobileMenu.style.top = (rect.bottom + 8) + 'px';
  }

  function toggle() {
    const isOpen = mobileMenu.classList.toggle('open');
    overlay.classList.toggle('open', isOpen);
    menuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    if (isOpen) positionDropdown();
  }

  function close() {
    mobileMenu.classList.remove('open');
    overlay.classList.remove('open');
    menuToggle.setAttribute('aria-label', 'Open menu');
  }

  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle();
  });

  overlay.addEventListener('click', close);

  mobileMenu.querySelectorAll('.ghost-btn').forEach((link) => {
    link.addEventListener('click', close);
  });

  // Theme toggle in mobile menu
  const mobileThemeToggle = mobileMenu.querySelector('.theme-toggle');
  if (mobileThemeToggle) {
    mobileThemeToggle.removeAttribute('id');
    mobileThemeToggle.addEventListener('click', () => {
      const nextTheme = body.dataset.theme === 'dark' ? 'light' : 'dark';
      setTheme(nextTheme);
      localStorage.setItem(STORAGE_KEY, nextTheme);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 640) close();
  });
}

function wireNavigation() {
  SCROLL_BTNS.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.querySelector(btn.dataset.scroll);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

async function hydrateFromApi() {
  try {
    const [summary, projects, skills, achievements, experience, timeline] = await Promise.all([
      fetchJson('/api/summary'),
      fetchJson('/api/projects'),
      fetchJson('/api/skills'),
      fetchJson('/api/achievements'),
      fetchJson('/api/experience'),
      fetchJson('/api/timeline'),
    ]);

    renderSummary(summary);
    renderProjects(projects?.projects || []);
    renderSkills(skills?.skills || []);
    renderAchievements(achievements?.achievements || []);
    renderExperience(experience?.experience || []);
    renderTimeline(timeline?.timeline || []);
  } catch (error) {
    console.error('Failed to load API data', error);
    renderErrorState();
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

function renderSummary(summary) {
  if (!summary || !summaryHeadline || !summaryBlurb) return;
  summaryHeadline.textContent = summary.headline;
  summaryBlurb.textContent = summary.blurb;
}

function renderProjects(list) {
  if (!projectsGrid) return;
  if (!list.length) {
    projectsGrid.innerHTML = '<p>No projects found. Check back soon.</p>';
    return;
  }

  projectsGrid.innerHTML = list.map(projectCard).join('');
  setupReadMore(projectsGrid);
}

// ── Skills: proficiency bars (grouped by category) + a radar chart ──
function renderSkills(list) {
  if (!skillsGroups) return;
  if (!list.length) {
    skillsGroups.innerHTML = '<p>No skills added yet. Check back soon.</p>';
    if (skillsRadar) skillsRadar.innerHTML = '';
    return;
  }

  // Group skills by category, preserving first-seen order.
  const groups = [];
  const seen = {};
  list.forEach((s) => {
    const cat = s.category || 'General';
    if (!(cat in seen)) {
      seen[cat] = groups.length;
      groups.push({ category: cat, items: [] });
    }
    groups[seen[cat]].items.push(s);
  });

  skillsGroups.innerHTML = groups
    .map(
      (g) => `
        <div class="skill-group">
          <h4 class="skill-group__title">${g.category}</h4>
          <ul class="skill-bars">
            ${g.items
              .map((s) => {
                const lvl = clampLevel(s.level);
                return `
                  <li class="skill-bar">
                    <div class="skill-bar__head">
                      <span class="skill-bar__name">${s.name}</span>
                      <span class="skill-bar__pct">${lvl}%</span>
                    </div>
                    <div class="skill-bar__track">
                      <div class="skill-bar__fill" style="--level:${lvl}%"></div>
                    </div>
                  </li>`;
              })
              .join('')}
          </ul>
        </div>`,
    )
    .join('');

  if (skillsRadar) {
    const axes = radarAxes(list);
    skillsRadar.innerHTML = buildRadarSvg(axes);
    skillsRadar.hidden = axes.length < 3;
  }
}

function clampLevel(v) {
  const n = Number(v) || 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

// Radar axes = one per category (value = average level). Falls back to
// individual skills when there are too few categories, and yields nothing
// when there aren't enough axes for a meaningful polygon (< 3).
function radarAxes(skills) {
  const byCat = {};
  const order = [];
  skills.forEach((s) => {
    const cat = s.category || 'General';
    if (!byCat[cat]) { byCat[cat] = []; order.push(cat); }
    byCat[cat].push(clampLevel(s.level));
  });

  if (order.length >= 3) {
    return order.map((cat) => {
      const vals = byCat[cat];
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      return { label: cat, value: Math.round(avg) };
    });
  }
  if (skills.length >= 3) {
    return skills.slice(0, 8).map((s) => ({ label: s.name, value: clampLevel(s.level) }));
  }
  return [];
}

// Build a responsive, theme-aware SVG radar chart (single-series magnitude).
function buildRadarSvg(axes) {
  const n = axes.length;
  if (n < 3) return '';

  const cx = 160;
  const cy = 135;
  const R = 88;
  const angle = (i) => (-90 + i * (360 / n)) * (Math.PI / 180);
  const point = (i, r) => [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))];
  const fmt = (pair) => pair.map((v) => v.toFixed(1)).join(',');

  const rings = [0.25, 0.5, 0.75, 1]
    .map((frac) => {
      const pts = axes.map((_, i) => fmt(point(i, R * frac))).join(' ');
      return `<polygon class="radar-grid" points="${pts}" />`;
    })
    .join('');

  const spokes = axes
    .map((_, i) => {
      const [x, y] = point(i, R);
      return `<line class="radar-axis" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" />`;
    })
    .join('');

  const dataPts = axes.map((a, i) => fmt(point(i, R * (a.value / 100)))).join(' ');
  const shape = `<polygon class="radar-shape" points="${dataPts}" />`;

  const dots = axes
    .map((a, i) => {
      const [x, y] = point(i, R * (a.value / 100));
      return `<circle class="radar-point" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" />`;
    })
    .join('');

  const labels = axes
    .map((a, i) => {
      const [lx, ly] = point(i, R + 16);
      const cos = Math.cos(angle(i));
      let anchor = 'middle';
      if (cos > 0.3) anchor = 'start';
      else if (cos < -0.3) anchor = 'end';
      const dy = ly < cy - R * 0.5 ? 0 : ly > cy + R * 0.5 ? 10 : 4;
      return `<text class="radar-label" x="${lx.toFixed(1)}" y="${(ly + dy).toFixed(1)}" text-anchor="${anchor}">${a.label}</text>`;
    })
    .join('');

  return `<svg viewBox="0 0 320 270" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Radar chart of average skill proficiency by category">${rings}${spokes}${shape}${dots}${labels}</svg>`;
}

function renderAchievements(list) {
  if (!achievementsGrid) return;
  if (!list.length) {
    achievementsGrid.innerHTML = '<p>No achievements yet. Check back soon.</p>';
    return;
  }

  achievementsGrid.innerHTML = list.map(achievementCard).join('');
  setupReadMore(achievementsGrid);
}

// ── Shared card markup (projects + achievements share one equal-size card) ──
// Static image used when a project has no image saved yet, and as an onerror
// fallback if a stored image path/data fails to load.
const FALLBACK_PROJECT_IMAGE = '/images/Cover.jpg';

function cardMedia(image, title, fallback) {
  const src = image || fallback;
  if (!src) return '';
  const onError = fallback
    ? ` onerror="this.onerror=null;this.src='${fallback}'"`
    : '';
  return `<div class="card__media"><img src="${src}" alt="${title}" loading="lazy"${onError}></div>`;
}

function projectCard({ title, description, stack = [], image, link, github }) {
  return `
    <article class="card">
      ${cardMedia(image, title, FALLBACK_PROJECT_IMAGE)}
      <div class="card__body">
        <p class="eyebrow">${stack[0] || 'Project'}</p>
        <h3>${title}</h3>
        <p class="card__desc">${description}</p>
        <button class="read-more-btn" type="button" hidden>Read more</button>
      </div>
      ${stack.length ? `<ul class="card__tags">${stack.map((tech) => `<li>${tech}</li>`).join('')}</ul>` : ''}
      <div class="card__footer">
        ${link ? `<a href="${link}" target="_blank" rel="noreferrer">View details →</a>` : ''}
        ${github ? `<a href="${github}" target="_blank" rel="noreferrer">GitHub Repo →</a>` : ''}
      </div>
    </article>
  `;
}

function achievementCard({ title, description, image, date }) {
  return `
    <article class="card">
      ${cardMedia(image, title)}
      <div class="card__body">
        <p class="eyebrow">Achievement</p>
        <h3>${title}</h3>
        <p class="card__desc">${description}</p>
        <button class="read-more-btn" type="button" hidden>Read more</button>
      </div>
      <div class="card__footer">
        ${date ? `<span class="card__date">${date}</span>` : ''}
      </div>
    </article>
  `;
}

// Reveal a "Read more" toggle only on cards whose description is actually
// clamped, then wire it to expand/collapse the card.
function setupReadMore(container) {
  container.querySelectorAll('.card').forEach((card) => {
    const desc = card.querySelector('.card__desc');
    const btn = card.querySelector('.read-more-btn');
    if (!desc || !btn) return;
    if (desc.scrollHeight - desc.clientHeight > 2) {
      btn.hidden = false;
      btn.addEventListener('click', () => {
        const expanded = card.classList.toggle('expanded');
        btn.textContent = expanded ? 'Read less' : 'Read more';
      });
    }
  });
}

function renderExperience(list) {
  if (!experienceList) return;
  if (!list.length) {
    experienceList.innerHTML = '<p>Work experience coming soon.</p>';
    return;
  }

  experienceList.innerHTML = list.map(experienceItem).join('');
}

function experienceItem({
  role,
  company,
  companyUrl,
  type,
  location,
  start,
  end,
  current,
  summary,
  highlights = [],
  stack = [],
}) {
  const period = [start, end].filter(Boolean).join(' – ');
  const companyName = companyUrl
    ? `<a href="${companyUrl}" target="_blank" rel="noreferrer">${company}</a>`
    : company;

  const meta = [
    type ? `<span class="exp-item__type">${type}</span>` : '',
    location ? `<span class="exp-item__location">${location}</span>` : '',
  ]
    .filter(Boolean)
    .join('');

  return `
    <article class="exp-item${current ? ' exp-item--current' : ''}">
      <div class="exp-item__marker" aria-hidden="true"></div>
      <div class="exp-item__body">
        <div class="exp-item__head">
          <div>
            <h3 class="exp-item__role">${role}</h3>
            <p class="exp-item__company">${companyName}${current ? '<span class="exp-item__badge">Current</span>' : ''}</p>
          </div>
          ${period ? `<time class="exp-item__period">${period}</time>` : ''}
        </div>
        ${meta ? `<div class="exp-item__meta">${meta}</div>` : ''}
        ${summary ? `<p class="exp-item__summary">${summary}</p>` : ''}
        ${highlights.length ? `<ul class="exp-item__highlights">${highlights.map((h) => `<li>${h}</li>`).join('')}</ul>` : ''}
        ${stack.length ? `<ul class="card__tags exp-item__stack">${stack.map((t) => `<li>${t}</li>`).join('')}</ul>` : ''}
      </div>
    </article>
  `;
}

function renderTimeline(list) {
  if (!timelineList) return;
  if (!list.length) {
    timelineList.innerHTML = '<li>Timeline coming soon.</li>';
    return;
  }

  timelineList.innerHTML = list
    .map(
      ({ year, milestone }) => `
        <li>
          <time>${year}</time>
          <p>${milestone}</p>
        </li>
      `,
    )
    .join('');
}

function renderErrorState() {
  const message = '<p class="form-status">Unable to load data from the server. Please refresh.</p>';
  if (projectsGrid) projectsGrid.innerHTML = message;
  if (skillsGroups) skillsGroups.innerHTML = message;
  if (achievementsGrid) achievementsGrid.innerHTML = message;
  if (experienceList) experienceList.innerHTML = message;
  if (timelineList) timelineList.innerHTML = message;
}

function highlightActiveNav() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-actions .ghost-btn, .mobile-dropdown .ghost-btn');
  
  navLinks.forEach((link) => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    
    if (currentPath === '/' && href === '/') {
      link.classList.add('active');
    } else if (currentPath === href || (currentPath.startsWith(href) && href !== '/')) {
      link.classList.add('active');
    }
  });
}

function initForm() {
  if (!contactForm || !formStatus) return;
  
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    formStatus.textContent = 'Sending...';

    const formData = new FormData(contactForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      formStatus.textContent = data.message;
      contactForm.reset();
    } catch (error) {
      console.error(error);
      formStatus.textContent = error.message;
    }
  });
}
