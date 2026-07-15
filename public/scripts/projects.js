const projectsGrid = document.getElementById('projects-grid');

async function loadProjects() {
  try {
    const response = await fetch('/api/projects');
    const data = await response.json();
    renderProjects(data?.projects || []);
  } catch (error) {
    console.error('Failed to load projects', error);
    projectsGrid.innerHTML = '<p class="form-status">Unable to load projects. Please refresh.</p>';
  }
}

function renderProjects(projects) {
  if (!projects.length) {
    projectsGrid.innerHTML = '<p>No projects found. Check back soon.</p>';
    return;
  }

  projectsGrid.innerHTML = projects.map(projectCard).join('');
  setupReadMore(projectsGrid);
}

// Static image used when a project has no image saved yet, and as an onerror
// fallback if a stored image path/data fails to load.
const FALLBACK_PROJECT_IMAGE = '/images/Cover.jpg';

function projectCard({ title, description, stack = [], image, link, github }) {
  const src = image || FALLBACK_PROJECT_IMAGE;
  const media = `<div class="card__media"><img src="${src}" alt="${title}" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_PROJECT_IMAGE}'"></div>`;
  return `
    <article class="card">
      ${media}
      <div class="card__body">
        <p class="eyebrow">${stack[0] || 'Project'}</p>
        <h3>${title}</h3>
        <p class="card__desc">${description}</p>
        <button class="read-more-btn" type="button" hidden>Read more</button>
      </div>
      ${stack.length ? `<ul class="card__tags">${stack.map((tech) => `<li>${tech}</li>`).join('')}</ul>` : ''}
      <div class="card__footer">
        ${link ? `<a href="${link}" target="_blank" rel="noreferrer">View Project →</a>` : ''}
        ${github ? `<a href="${github}" target="_blank" rel="noreferrer">GitHub Repo →</a>` : ''}
      </div>
    </article>
  `;
}

// Reveal a "Read more" toggle only on cards whose description is clamped.
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

loadProjects();

