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
    skills: '/api/skills',
    achievements: '/api/achievements',
    blog: '/api/blog',
  };

  const state = {
    projects: [],
    skills: [],
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
      const [projRes, skillRes, achRes, blogRes] = await Promise.all([
        fetchJSON(API.projects),
        fetchJSON(API.skills),
        fetchJSON(API.achievements),
        fetchJSON(API.blog),
      ]);
      state.projects = projRes.projects || [];
      state.skills = skillRes.skills || [];
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
    $('#stat-skills').textContent = state.skills.length;
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
      case 'skills': renderSkills(); break;
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

  // ── Render: Skills ──
  function renderSkills() {
    const tbody = $('#table-skills tbody');
    const empty = $('#empty-skills');
    if (!state.skills.length) {
      tbody.innerHTML = '';
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    tbody.innerHTML = state.skills.map((s) => `
      <tr>
        <td><strong>${esc(s.name)}</strong></td>
        <td class="hide-mobile">${esc(s.category || '')}</td>
        <td>
          <div class="cell-level">
            <div class="cell-level__track"><div class="cell-level__fill" style="width:${Number(s.level) || 0}%"></div></div>
            <span>${Number(s.level) || 0}%</span>
          </div>
        </td>
        <td>
          <div class="action-btns">
            <button class="btn-edit" data-type="skill" data-id="${s._id}">Edit</button>
            <button class="btn-delete" data-type="skill" data-id="${s._id}">Delete</button>
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
      { name: 'image', label: 'Image', type: 'image', hint: 'Uploaded and stored in the database. Optional.' },
      { name: 'stack', label: 'Tech Stack', type: 'text', hint: 'Comma-separated (e.g. React, Node.js, MongoDB)' },
      { name: 'link', label: 'Live Link', type: 'url' },
      { name: 'github', label: 'GitHub URL', type: 'url' },
    ],
    skill: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'text', hint: 'e.g. Frontend, Backend, Languages, Tools' },
      { name: 'level', label: 'Proficiency Level', type: 'range' },
    ],
    achievement: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      { name: 'date', label: 'Date', type: 'text', hint: 'e.g. March 2024' },
      { name: 'image', label: 'Image', type: 'image', hint: 'Uploaded and stored in the database. Optional.' },
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

      if (f.type === 'range') {
        const level = val === '' || val == null ? 50 : val;
        return `
          <label>
            ${f.label}${f.required ? ' *' : ''}
            <div class="range-field">
              <input type="range" name="${f.name}" min="0" max="100" step="1" value="${esc(level)}" />
              <output class="range-field__value">${esc(level)}%</output>
            </div>
            ${f.hint ? `<span class="hint">${f.hint}</span>` : ''}
          </label>
        `;
      }

      if (f.type === 'image') {
        return `
          <label>
            ${f.label}${f.required ? ' *' : ''}
            <div class="image-field" data-name="${f.name}">
              <input type="hidden" name="${f.name}" value="${esc(val)}" />
              <input type="file" class="image-field__file" accept="image/*" data-target="${f.name}" />
              <div class="image-field__preview" ${val ? '' : 'hidden'}>
                <img src="${esc(val)}" alt="Preview" />
                <button type="button" class="image-field__remove" data-target="${f.name}">Remove</button>
              </div>
            </div>
            ${f.hint ? `<span class="hint">${f.hint}</span>` : ''}
          </label>
        `;
      }

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

  // Downscale an image file in the browser and return a Base64 JPEG data URL.
  // Keeps rows stored in Postgres small (large uploads are resized to fit
  // within maxDim on the longest side).
  function fileToResizedDataUrl(file, maxDim = 1000, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read file'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Invalid image file'));
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            const scale = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // ── Image field: upload / preview / remove (event delegation) ──
  modalFields.addEventListener('change', async (e) => {
    const fileInput = e.target.closest('.image-field__file');
    if (!fileInput) return;
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    const wrap = fileInput.closest('.image-field');
    const hidden = wrap.querySelector(`input[type="hidden"]`);
    const preview = wrap.querySelector('.image-field__preview');
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      hidden.value = dataUrl;
      preview.querySelector('img').src = dataUrl;
      preview.hidden = false;
    } catch (err) {
      showToast(err.message || 'Failed to process image', true);
      fileInput.value = '';
    }
  });

  modalFields.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.image-field__remove');
    if (!removeBtn) return;
    const wrap = removeBtn.closest('.image-field');
    wrap.querySelector('input[type="hidden"]').value = '';
    wrap.querySelector('.image-field__file').value = '';
    wrap.querySelector('.image-field__preview').hidden = true;
  });

  // ── Range field: live value readout ──
  modalFields.addEventListener('input', (e) => {
    const range = e.target.closest('input[type="range"]');
    if (!range) return;
    const output = range.parentElement.querySelector('.range-field__value');
    if (output) output.textContent = `${range.value}%`;
  });

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
    const map = { project: API.projects, skill: API.skills, achievement: API.achievements, blog: API.blog };
    return map[type];
  }

  function stateKey(type) {
    const map = { project: 'projects', skill: 'skills', achievement: 'achievements', blog: 'blog' };
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
      if (type === 'blog') openBlogEditor(id);
      else openModal(type, id);
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
  $('#btn-add-skill').addEventListener('click', () => openModal('skill'));
  $('#btn-add-achievement').addEventListener('click', () => openModal('achievement'));
  $('#btn-add-blog').addEventListener('click', () => openBlogEditor());

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

  /* ══════════════════════════════════════════════════════════════════════
   *  WordPress-style Blog Editor
   *  A dedicated full-screen view (not the generic modal) with a Quill
   *  WYSIWYG main panel + settings sidebar and a real-time SEO analyzer.
   * ════════════════════════════════════════════════════════════════════ */

  const editorEl = $('#blog-editor');
  const mainEl = document.querySelector('main');
  const editor = { quill: null, editingId: null, status: 'draft', seoTimer: null, lastScore: 0 };

  // Register Quill format extensions once so alt text and link target/rel
  // attributes survive serialization.
  function registerQuillFormats() {
    if (registerQuillFormats._done || typeof Quill === 'undefined') return;
    registerQuillFormats._done = true;

    const Link = Quill.import('formats/link');
    class CustomLink extends Link {
      static create(value) {
        const href = typeof value === 'string' ? value : value.href;
        const node = super.create(href);
        if (value && typeof value === 'object') {
          if (value.target) node.setAttribute('target', value.target);
          else node.removeAttribute('target');
          if (value.rel) node.setAttribute('rel', value.rel);
          else node.removeAttribute('rel');
        }
        return node;
      }
      static formats(node) {
        return {
          href: node.getAttribute('href'),
          target: node.getAttribute('target') || '',
          rel: node.getAttribute('rel') || '',
        };
      }
    }
    Quill.register(CustomLink, true);

    const Image = Quill.import('formats/image');
    class CustomImage extends Image {
      static create(value) {
        const src = typeof value === 'string' ? value : value.src;
        const node = super.create(src);
        if (value && typeof value === 'object' && value.alt) node.setAttribute('alt', value.alt);
        return node;
      }
      static value(node) {
        return { src: node.getAttribute('src'), alt: node.getAttribute('alt') || '' };
      }
    }
    Quill.register(CustomImage, true);
  }

  function initQuill() {
    if (editor.quill) return editor.quill;
    registerQuillFormats();

    editor.quill = new Quill('#quill-editor', {
      theme: 'snow',
      placeholder: 'Start writing your post…',
      modules: {
        toolbar: {
          container: [
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image'],
            ['clean'],
          ],
          handlers: {
            image: imageHandler,
            link: linkHandler,
          },
        },
      },
    });

    // Drag-and-drop images onto the editor surface.
    const root = editor.quill.root;
    root.addEventListener('dragover', (e) => { e.preventDefault(); root.classList.add('is-dragover'); });
    root.addEventListener('dragleave', () => root.classList.remove('is-dragover'));
    root.addEventListener('drop', async (e) => {
      root.classList.remove('is-dragover');
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (!file || !file.type.startsWith('image/')) return;
      e.preventDefault();
      await insertImageFile(file);
    });

    editor.quill.on('text-change', scheduleSeo);
    return editor.quill;
  }

  // Custom image toolbar handler → pick file, resize, prompt alt, insert.
  function imageHandler() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files && input.files[0];
      if (file) await insertImageFile(file);
    };
    input.click();
  }

  async function insertImageFile(file) {
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      const alt = (window.prompt('Image alt text (important for SEO & accessibility):', '') || '').trim();
      const range = editor.quill.getSelection(true) || { index: editor.quill.getLength() };
      editor.quill.insertEmbed(range.index, 'image', { src: dataUrl, alt }, 'user');
      editor.quill.setSelection(range.index + 1, 0);
      scheduleSeo();
    } catch (err) {
      showToast(err.message || 'Failed to process image', true);
    }
  }

  // Custom link handler with target/nofollow toggles.
  let linkDialog = null;
  function buildLinkDialog() {
    if (linkDialog) return linkDialog;
    const el = document.createElement('div');
    el.className = 'link-dialog';
    el.hidden = true;
    el.innerHTML = `
      <div class="link-dialog__box">
        <h4>Insert Link</h4>
        <label>URL<input type="url" class="link-dialog__url" placeholder="https://example.com" /></label>
        <label class="link-dialog__check"><input type="checkbox" class="link-dialog__blank" /> Open in new tab (target="_blank")</label>
        <label class="link-dialog__check"><input type="checkbox" class="link-dialog__nofollow" /> Add rel="nofollow"</label>
        <div class="link-dialog__actions">
          <button type="button" class="secondary-btn link-dialog__cancel">Cancel</button>
          <button type="button" class="primary-btn link-dialog__apply">Apply</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    linkDialog = el;
    return el;
  }

  function linkHandler() {
    const range = editor.quill.getSelection(true);
    if (!range) return;
    const dlg = buildLinkDialog();
    const urlInput = dlg.querySelector('.link-dialog__url');
    const blankInput = dlg.querySelector('.link-dialog__blank');
    const nofollowInput = dlg.querySelector('.link-dialog__nofollow');

    // Prefill from existing link at the cursor.
    const existing = editor.quill.getFormat(range).link;
    urlInput.value = existing && existing.href ? existing.href : (existing || '');
    blankInput.checked = !!(existing && existing.target === '_blank');
    nofollowInput.checked = !!(existing && (existing.rel || '').includes('nofollow'));

    dlg.hidden = false;
    setTimeout(() => urlInput.focus(), 30);

    const close = () => { dlg.hidden = true; cleanup(); };
    const apply = () => {
      const url = urlInput.value.trim();
      if (!url) { editor.quill.format('link', false); close(); return; }
      const value = {
        href: url,
        target: blankInput.checked ? '_blank' : '',
        rel: nofollowInput.checked ? 'nofollow' : '',
      };
      editor.quill.setSelection(range.index, range.length);
      if (range.length === 0) {
        editor.quill.insertText(range.index, url, 'link', value, 'user');
      } else {
        editor.quill.format('link', value, 'user');
      }
      scheduleSeo();
      close();
    };
    const onKey = (e) => { if (e.key === 'Escape') close(); if (e.key === 'Enter' && e.target === urlInput) { e.preventDefault(); apply(); } };
    function cleanup() {
      dlg.querySelector('.link-dialog__apply').removeEventListener('click', apply);
      dlg.querySelector('.link-dialog__cancel').removeEventListener('click', close);
      dlg.removeEventListener('keydown', onKey);
    }
    dlg.querySelector('.link-dialog__apply').addEventListener('click', apply);
    dlg.querySelector('.link-dialog__cancel').addEventListener('click', close);
    dlg.addEventListener('keydown', onKey);
  }

  // ── Open / close the editor view ──
  async function openBlogEditor(id = null) {
    initQuill();
    editor.editingId = id;

    let data = { author: 'Emul Sajib', status: 'draft', contentFormat: 'html' };
    if (id) {
      const cached = state.blog.find((b) => b._id === id) || {};
      if (cached.content != null) {
        data = cached;
      } else {
        try {
          data = await fetchJSON(`${API.blog}/${id}`);
          const idx = state.blog.findIndex((b) => b._id === id);
          if (idx !== -1) Object.assign(state.blog[idx], data);
        } catch {
          showToast('Failed to load full blog post', true);
          return;
        }
      }
    }

    // Populate fields.
    $('#editor-heading').textContent = id ? 'Edit Post' : 'New Post';
    $('#editor-title').value = data.title || '';
    $('#editor-slug').value = data.slug || '';
    $('#editor-excerpt').value = data.excerpt || '';
    $('#editor-author').value = data.author || 'Emul Sajib';
    $('#editor-date').value = data.date || '';
    $('#editor-categories').value = (data.categories || []).join(', ');
    $('#editor-tags').value = (data.tags || []).join(', ');
    $('#editor-focus-keyword').value = data.focusKeyword || '';
    $('#editor-meta-title').value = data.metaTitle || '';
    $('#editor-meta-description').value = data.metaDescription || '';
    setFeaturedImage(data.featuredImage || '');
    editor.status = data.status === 'published' ? 'published' : 'draft';
    updateStatusPill();

    // Load content into Quill.
    editor.quill.setText('');
    if (data.content) {
      if (data.contentFormat === 'html') {
        editor.quill.clipboard.dangerouslyPasteHTML(DOMPurify.sanitize(data.content));
      } else {
        // Legacy markdown-ish post: drop in as plain text for reformatting.
        editor.quill.setText(data.content);
      }
    }

    mainEl.hidden = true;
    editorEl.hidden = false;
    window.scrollTo(0, 0);
    runSeo();
    setTimeout(() => $('#editor-title').focus(), 50);
  }

  function closeBlogEditor() {
    editorEl.hidden = true;
    mainEl.hidden = false;
    editor.editingId = null;
  }

  function updateStatusPill() {
    const pill = $('#editor-status-pill');
    pill.dataset.status = editor.status;
    pill.textContent = editor.status === 'published' ? 'Published' : 'Draft';
  }

  // ── Featured image ──
  function setFeaturedImage(url) {
    $('#editor-featured-image').value = url || '';
    const preview = $('#featured-image-preview');
    const drop = $('#featured-image-drop');
    if (url) {
      preview.querySelector('img').src = url;
      preview.hidden = false;
      drop.hidden = true;
    } else {
      preview.hidden = true;
      drop.hidden = false;
    }
  }

  async function handleFeaturedFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const dataUrl = await fileToResizedDataUrl(file, 1400, 0.85);
      setFeaturedImage(dataUrl);
    } catch (err) {
      showToast(err.message || 'Failed to process image', true);
    }
  }

  $('#featured-image-file').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) handleFeaturedFile(file);
  });
  $('#featured-image-remove').addEventListener('click', () => setFeaturedImage(''));
  const fiDrop = $('#featured-image-drop');
  fiDrop.addEventListener('dragover', (e) => { e.preventDefault(); fiDrop.classList.add('is-dragover'); });
  fiDrop.addEventListener('dragleave', () => fiDrop.classList.remove('is-dragover'));
  fiDrop.addEventListener('drop', (e) => {
    e.preventDefault();
    fiDrop.classList.remove('is-dragover');
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) handleFeaturedFile(file);
  });

  // ── Real-time SEO analysis ──
  function collectSeoInput() {
    const titleVal = $('#editor-title').value;
    return {
      focusKeyword: $('#editor-focus-keyword').value,
      title: titleVal,
      metaTitle: $('#editor-meta-title').value || titleVal,
      metaDescription: $('#editor-meta-description').value,
      slug: $('#editor-slug').value,
      excerpt: $('#editor-excerpt').value,
      contentHtml: editor.quill ? editor.quill.root.innerHTML : '',
    };
  }

  function scheduleSeo() {
    clearTimeout(editor.seoTimer);
    editor.seoTimer = setTimeout(runSeo, 350);
  }

  function runSeo() {
    if (typeof SEOAnalyzer === 'undefined') return;
    const result = SEOAnalyzer.analyze(collectSeoInput());
    editor.lastScore = result.score;

    // Score ring.
    const ring = $('#seo-ring');
    const band = result.score >= 70 ? 'good' : result.score >= 45 ? 'ok' : 'bad';
    ring.dataset.band = band;
    ring.style.setProperty('--pct', result.score);
    $('#seo-score-value').textContent = result.score;
    $('#seo-score-label').textContent =
      band === 'good' ? 'Good' : band === 'ok' ? 'Needs work' : 'Poor';
    $('#seo-wordcount').textContent = `${result.wordCount} words`;

    renderChecklist($('#seo-checklist'), result.checks);
    renderChecklist($('#readability-checklist'), result.readability.checks);
    updateCharMeter('#meta-title-fill', '#meta-title-count', result.meta.titleLength, 60);
    updateCharMeter('#meta-desc-fill', '#meta-desc-count', result.meta.descriptionLength, 160);
  }

  function renderChecklist(ul, checks) {
    ul.innerHTML = checks.map((c) => `
      <li class="seo-check seo-check--${c.status}">
        <span class="seo-check__dot"></span>
        <span class="seo-check__text"><strong>${esc(c.label)}:</strong> ${esc(c.text)}</span>
      </li>
    `).join('');
  }

  function updateCharMeter(fillSel, countSel, len, max) {
    const fill = $(fillSel);
    const count = $(countSel);
    const wrap = fill.closest('.char-meter');
    const min = Number(wrap.dataset.min) || 0;
    const hardMax = Number(wrap.dataset.max) || max;
    fill.style.width = `${Math.min(100, (len / hardMax) * 100)}%`;
    let band = 'bad';
    if (len === 0) band = 'empty';
    else if (len < min) band = 'ok';
    else if (len <= hardMax) band = 'good';
    else band = 'bad';
    wrap.dataset.band = band;
    count.textContent = `${len} / ${hardMax}`;
  }

  // ── Save ──
  function parseCsv(sel) {
    const val = $(sel).value || '';
    return val.split(',').map((s) => s.trim()).filter(Boolean);
  }

  async function saveBlog(status) {
    const title = $('#editor-title').value.trim();
    if (!title) { showToast('Title is required', true); $('#editor-title').focus(); return; }

    const rawHtml = editor.quill.root.innerHTML;
    const content = DOMPurify.sanitize(rawHtml, { ADD_ATTR: ['target', 'rel'] });
    const excerpt = $('#editor-excerpt').value.trim()
      || (editor.quill.getText().trim().slice(0, 160));

    const payload = {
      title,
      slug: $('#editor-slug').value.trim(),
      excerpt,
      content,
      contentFormat: 'html',
      author: $('#editor-author').value.trim() || 'Emul Sajib',
      date: $('#editor-date').value.trim(),
      tags: parseCsv('#editor-tags'),
      categories: parseCsv('#editor-categories'),
      featuredImage: $('#editor-featured-image').value,
      metaTitle: $('#editor-meta-title').value.trim(),
      metaDescription: $('#editor-meta-description').value.trim(),
      focusKeyword: $('#editor-focus-keyword').value.trim(),
      status,
      seoScore: editor.lastScore,
    };

    const id = editor.editingId;
    const url = id ? `${API.blog}/${id}` : API.blog;
    const method = id ? 'PUT' : 'POST';
    try {
      const result = await fetchJSON(url, { method, body: JSON.stringify(payload) });
      if (id) {
        const idx = state.blog.findIndex((b) => b._id === id);
        if (idx !== -1) state.blog[idx] = result;
      } else {
        state.blog.push(result);
        editor.editingId = result._id;
      }
      editor.status = status;
      $('#editor-heading').textContent = 'Edit Post';
      updateStatusPill();
      updateStats();
      renderBlog();
      showToast(status === 'published' ? 'Post published!' : 'Draft saved.');
    } catch (err) {
      showToast(err.message, true);
    }
  }

  // ── Preview overlay ──
  function openPreview() {
    const overlay = $('#preview-overlay');
    $('#preview-title').textContent = $('#editor-title').value || 'Untitled';
    $('#preview-date').textContent = $('#editor-date').value || '';
    $('#preview-author').textContent = $('#editor-author').value || '';
    const featured = $('#editor-featured-image').value;
    const fimg = $('#preview-featured');
    if (featured) { fimg.src = featured; fimg.hidden = false; } else { fimg.hidden = true; }
    $('#preview-body').innerHTML = DOMPurify.sanitize(editor.quill.root.innerHTML, { ADD_ATTR: ['target', 'rel'] });
    overlay.hidden = false;
  }

  // ── Editor event wiring ──
  $('#editor-back').addEventListener('click', closeBlogEditor);
  $('#editor-save-draft').addEventListener('click', () => saveBlog('draft'));
  $('#editor-publish').addEventListener('click', () => saveBlog('published'));
  $('#editor-preview').addEventListener('click', openPreview);
  $('#preview-close').addEventListener('click', () => { $('#preview-overlay').hidden = true; });

  ['#editor-title', '#editor-slug', '#editor-excerpt', '#editor-focus-keyword',
   '#editor-meta-title', '#editor-meta-description'].forEach((sel) => {
    $(sel).addEventListener('input', scheduleSeo);
  });

  // ── Init ──
  loadAll();

  } // end initDashboard
})();
