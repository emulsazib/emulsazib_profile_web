(() => {
  'use strict';

  const TOKEN_KEY = 'admin_token';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '/admin/login';
  }

  // ── Auth gate: redirect to login if no valid token ──
  (async function checkAuth() {
    const token = getToken();
    if (!token) { window.location.href = '/admin/login'; return; }
    try {
      const res = await fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status !== 'ok') { logout(); return; }
      initDashboard(data.username);
    } catch {
      logout();
    }
  })();

  function initDashboard(username) {

  const API = {
    projects: '/api/projects',
    achievements: '/api/achievements',
    blog: '/api/blog',
  };

  const state = {
    projects: [],
    achievements: [],
    blog: [],
    activeTab: 'projects',
    editingId: null,
    editingType: null,
    deleteId: null,
    deleteType: null,
  };

  // ── DOM refs ──
  const $ = (sel) => document.querySelector(sel);
  const tabs = document.querySelectorAll('.admin-tab');
  const toast = $('#toast');
  const modalBackdrop = $('#modal-backdrop');
  const modalForm = $('#modal-form');
  const modalTitle = $('#modal-title');
  const modalFields = $('#modal-fields');
  const modalClose = $('#modal-close');
  const modalCancel = $('#modal-cancel');
  const deleteBackdrop = $('#delete-backdrop');
  const deleteConfirm = $('#delete-confirm');
  const deleteCancel = $('#delete-cancel');
  const deleteClose = $('#delete-close');

  // ── Show user info + logout in nav ──
  const navActions = $('.nav-actions');
  if (navActions && username) {
    const initial = username.charAt(0).toUpperCase();
    const userEl = document.createElement('div');
    userEl.className = 'admin-user';
    userEl.innerHTML = `<span class="admin-user__avatar">${initial}</span><span>${esc(username)}</span>`;
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'logout-btn';
    logoutBtn.textContent = 'Logout';
    logoutBtn.addEventListener('click', logout);
    navActions.insertBefore(userEl, navActions.firstChild);
    navActions.insertBefore(logoutBtn, navActions.children[1]);
  }

  // ── Theme toggle ──
  const themeToggle = $('#theme-toggle');
  if (themeToggle) {
    const saved = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', saved);
    themeToggle.addEventListener('click', () => {
      const next = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.body.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }

  // ── Year ──
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ── Toast ──
  function showToast(msg, isError = false) {
    toast.textContent = msg;
    toast.classList.toggle('toast--error', isError);
    toast.hidden = false;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.hidden = true; }, 3000);
  }

  // ── Fetch helpers (with auth) ──
  async function fetchJSON(url, opts = {}) {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json', ...opts.headers };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(url, { ...opts, headers });
    if (res.status === 401) { logout(); return; }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Request failed (${res.status})`);
    }
    return res.json();
  }

  // ── Load all data ──
  async function loadAll() {
    try {
      const [projRes, achRes, blogRes] = await Promise.all([
        fetchJSON(API.projects),
        fetchJSON(API.achievements),
        fetchJSON(API.blog),
      ]);
      state.projects = projRes.projects || [];
      state.achievements = achRes.achievements || [];
      state.blog = blogRes.posts || [];
      updateStats();
      renderActiveTab();
    } catch (err) {
      showToast('Failed to load data: ' + err.message, true);
    }
  }

  function updateStats() {
    $('#stat-projects').textContent = state.projects.length;
    $('#stat-achievements').textContent = state.achievements.length;
    $('#stat-blog').textContent = state.blog.length;
  }

  // ── Tab switching ──
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      state.activeTab = tab.dataset.tab;
      document.querySelectorAll('.admin-section').forEach((s) => { s.hidden = true; });
      $(`#section-${state.activeTab}`).hidden = false;
      renderActiveTab();
    });
  });

  function renderActiveTab() {
    switch (state.activeTab) {
      case 'projects': renderProjects(); break;
      case 'achievements': renderAchievements(); break;
      case 'blog': renderBlog(); break;
    }
  }

  // ── Render: Projects ──
  function renderProjects() {
    const tbody = $('#table-projects tbody');
    const empty = $('#empty-projects');
    if (!state.projects.length) {
      tbody.innerHTML = '';
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    tbody.innerHTML = state.projects.map((p) => `
      <tr>
        <td><strong>${esc(p.title)}</strong></td>
        <td class="hide-mobile">
          <div class="cell-stack">${(p.stack || []).map((s) => `<span>${esc(s)}</span>`).join('')}</div>
        </td>
        <td class="hide-mobile"><div class="cell-desc">${esc(p.description)}</div></td>
        <td>
          <div class="action-btns">
            <button class="btn-edit" data-type="project" data-id="${p._id}">Edit</button>
            <button class="btn-delete" data-type="project" data-id="${p._id}">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // ── Render: Achievements ──
  function renderAchievements() {
    const tbody = $('#table-achievements tbody');
    const empty = $('#empty-achievements');
    if (!state.achievements.length) {
      tbody.innerHTML = '';
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    tbody.innerHTML = state.achievements.map((a) => `
      <tr>
        <td><strong>${esc(a.title)}</strong></td>
        <td class="hide-mobile">${esc(a.date || '')}</td>
        <td class="hide-mobile"><div class="cell-desc">${esc(a.description)}</div></td>
        <td>
          <div class="action-btns">
            <button class="btn-edit" data-type="achievement" data-id="${a._id}">Edit</button>
            <button class="btn-delete" data-type="achievement" data-id="${a._id}">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // ── Render: Blog ──
  function renderBlog() {
    const tbody = $('#table-blog tbody');
    const empty = $('#empty-blog');
    if (!state.blog.length) {
      tbody.innerHTML = '';
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    tbody.innerHTML = state.blog.map((b) => `
      <tr>
        <td><strong>${esc(b.title)}</strong></td>
        <td class="hide-mobile">${esc(b.author || '')}</td>
        <td class="hide-mobile">${esc(b.date || '')}</td>
        <td>
          <div class="action-btns">
            <button class="btn-edit" data-type="blog" data-id="${b._id}">Edit</button>
            <button class="btn-delete" data-type="blog" data-id="${b._id}">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // ── Form field definitions ──
  const formDefs = {
    project: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      { name: 'stack', label: 'Tech Stack', type: 'text', hint: 'Comma-separated (e.g. React, Node.js, MongoDB)' },
      { name: 'link', label: 'Live Link', type: 'url' },
      { name: 'github', label: 'GitHub URL', type: 'url' },
    ],
    achievement: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      { name: 'date', label: 'Date', type: 'text', hint: 'e.g. March 2024' },
      { name: 'image', label: 'Image URL', type: 'url' },
    ],
    blog: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'excerpt', label: 'Excerpt', type: 'textarea', required: true },
      { name: 'content', label: 'Content', type: 'textarea', required: true, rows: 8 },
      { name: 'author', label: 'Author', type: 'text', required: true },
      { name: 'date', label: 'Date', type: 'text', hint: 'e.g. January 15, 2025' },
      { name: 'tags', label: 'Tags', type: 'text', hint: 'Comma-separated (e.g. JavaScript, Web Dev)' },
    ],
  };

  function buildFormFields(type, data = {}) {
    const fields = formDefs[type];
    modalFields.innerHTML = fields.map((f) => {
      let val = data[f.name] || '';
      if (Array.isArray(val)) val = val.join(', ');
      const inputEl = f.type === 'textarea'
        ? `<textarea name="${f.name}" rows="${f.rows || 3}" ${f.required ? 'required' : ''} placeholder="Enter ${f.label.toLowerCase()}...">${esc(val)}</textarea>`
        : `<input type="${f.type}" name="${f.name}" value="${esc(val)}" ${f.required ? 'required' : ''} placeholder="Enter ${f.label.toLowerCase()}..." />`;
      return `
        <label>
          ${f.label}${f.required ? ' *' : ''}
          ${inputEl}
          ${f.hint ? `<span class="hint">${f.hint}</span>` : ''}
        </label>
      `;
    }).join('');
  }

  function getFormData(type) {
    const fd = new FormData(modalForm);
    const data = {};
    formDefs[type].forEach((f) => {
      let val = fd.get(f.name) || '';
      if (f.name === 'stack' || f.name === 'tags') {
        data[f.name] = val ? val.split(',').map((s) => s.trim()).filter(Boolean) : [];
      } else {
        data[f.name] = val;
      }
    });
    return data;
  }

  // ── API endpoint for type ──
  function apiUrl(type) {
    const map = { project: API.projects, achievement: API.achievements, blog: API.blog };
    return map[type];
  }

  function stateKey(type) {
    const map = { project: 'projects', achievement: 'achievements', blog: 'blog' };
    return map[type];
  }

  // ── Open modal ──
  function openModal(type, id = null) {
    state.editingType = type;
    state.editingId = id;
    const isEdit = !!id;
    modalTitle.textContent = isEdit ? `Edit ${capitalize(type)}` : `Add ${capitalize(type)}`;
    $('#modal-submit').textContent = isEdit ? 'Update' : 'Create';

    let data = {};
    if (isEdit) {
      const list = state[stateKey(type)];
      data = list.find((item) => item._id === id) || {};

      if (type === 'blog' && data && !data.content) {
        fetchJSON(`${API.blog}/${id}`).then((full) => {
          data = full;
          const idx = state.blog.findIndex((b) => b._id === id);
          if (idx !== -1) Object.assign(state.blog[idx], full);
          buildFormFields(type, data);
        }).catch(() => {
          showToast('Failed to load full blog post', true);
        });
      }
    }

    buildFormFields(type, data);
    modalBackdrop.hidden = false;
    const firstInput = modalFields.querySelector('input, textarea');
    if (firstInput) setTimeout(() => firstInput.focus(), 50);
  }

  function closeModal() {
    modalBackdrop.hidden = true;
    state.editingId = null;
    state.editingType = null;
    modalForm.reset();
  }

  // ── Open delete confirm ──
  function openDelete(type, id) {
    state.deleteType = type;
    state.deleteId = id;
    deleteBackdrop.hidden = false;
  }

  function closeDelete() {
    deleteBackdrop.hidden = true;
    state.deleteType = null;
    state.deleteId = null;
  }

  // ── Save (Create / Update) ──
  async function handleSave(e) {
    e.preventDefault();
    const type = state.editingType;
    const id = state.editingId;
    const data = getFormData(type);
    const url = id ? `${apiUrl(type)}/${id}` : apiUrl(type);
    const method = id ? 'PUT' : 'POST';

    try {
      const result = await fetchJSON(url, { method, body: JSON.stringify(data) });
      const key = stateKey(type);
      if (id) {
        const idx = state[key].findIndex((item) => item._id === id);
        if (idx !== -1) state[key][idx] = result;
      } else {
        state[key].push(result);
      }
      closeModal();
      updateStats();
      renderActiveTab();
      showToast(`${capitalize(type)} ${id ? 'updated' : 'created'} successfully!`);
    } catch (err) {
      showToast(err.message, true);
    }
  }

  // ── Delete ──
  async function handleDelete() {
    const type = state.deleteType;
    const id = state.deleteId;
    try {
      await fetchJSON(`${apiUrl(type)}/${id}`, { method: 'DELETE' });
      const key = stateKey(type);
      state[key] = state[key].filter((item) => item._id !== id);
      closeDelete();
      updateStats();
      renderActiveTab();
      showToast(`${capitalize(type)} deleted.`);
    } catch (err) {
      showToast(err.message, true);
    }
  }

  // ── Event delegation for edit/delete buttons ──
  document.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.btn-edit');
    if (editBtn) {
      const type = editBtn.dataset.type;
      const id = editBtn.dataset.id;
      openModal(type, id);
      return;
    }

    const deleteBtn = e.target.closest('.btn-delete');
    if (deleteBtn) {
      const type = deleteBtn.dataset.type;
      const id = deleteBtn.dataset.id;
      openDelete(type, id);
      return;
    }
  });

  // ── Add buttons ──
  $('#btn-add-project').addEventListener('click', () => openModal('project'));
  $('#btn-add-achievement').addEventListener('click', () => openModal('achievement'));
  $('#btn-add-blog').addEventListener('click', () => openModal('blog'));

  // ── Modal events ──
  modalClose.addEventListener('click', closeModal);
  modalCancel.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) closeModal(); });
  modalForm.addEventListener('submit', handleSave);

  // ── Delete events ──
  deleteClose.addEventListener('click', closeDelete);
  deleteCancel.addEventListener('click', closeDelete);
  deleteConfirm.addEventListener('click', handleDelete);
  deleteBackdrop.addEventListener('click', (e) => { if (e.target === deleteBackdrop) closeDelete(); });

  // ── Keyboard: Escape to close ──
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!modalBackdrop.hidden) closeModal();
      if (!deleteBackdrop.hidden) closeDelete();
    }
  });

  // ── Helpers ──
  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function capitalize(s) {
    if (s === 'blog') return 'Blog Post';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // ── Init ──
  loadAll();

  } // end initDashboard
})();
