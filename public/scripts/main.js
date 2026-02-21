const body = document.body;
const themeToggle = document.getElementById('theme-toggle');
const projectsGrid = document.getElementById('projects-grid');
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
    const [summary, projects, timeline] = await Promise.all([
      fetchJson('/api/summary'),
      fetchJson('/api/projects'),
      fetchJson('/api/timeline'),
    ]);

    renderSummary(summary);
    renderProjects(projects?.projects || []);
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

  projectsGrid.innerHTML = list
    .map(
      ({ title, description, stack, link, github }) => `
        <article class="project-card">
          <div>
            <p class="eyebrow">${stack[0] || 'Project'}</p>
            <h3>${title}</h3>
            <p>${description}</p>
          </div>
          <ul>
            ${stack.map((tech) => `<li>${tech}</li>`).join('')}
          </ul>
          <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
            ${link ? `<a href="${link}" target="_blank" rel="noreferrer">View details →</a>` : ''}
            ${github ? `<a href="${github}" target="_blank" rel="noreferrer">GitHub Repo →</a>` : ''}
          </div>
        </article>
      `,
    )
    .join('');
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
