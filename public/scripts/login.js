(() => {
  'use strict';

  const TOKEN_KEY = 'admin_token';

  if (localStorage.getItem(TOKEN_KEY)) {
    fetch('/api/auth/verify', {
      headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.status === 'ok') window.location.href = '/admin';
      })
      .catch(() => {});
  }

  const $ = (sel) => document.querySelector(sel);

  // Theme
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

  // Year
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Password visibility
  const toggleBtn = $('#toggle-password');
  const pwInput = $('#input-password');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isHidden = pwInput.type === 'password';
      pwInput.type = isHidden ? 'text' : 'password';
      toggleBtn.querySelector('.eye-open').style.display = isHidden ? 'none' : 'block';
      toggleBtn.querySelector('.eye-closed').style.display = isHidden ? 'block' : 'none';
    });
  }

  // Login form
  const form = $('#login-form');
  const errorEl = $('#login-error');
  const submitBtn = $('#login-submit');
  const btnText = submitBtn.querySelector('.login-btn__text');
  const btnLoader = submitBtn.querySelector('.login-btn__loader');

  function setLoading(loading) {
    submitBtn.disabled = loading;
    btnText.hidden = loading;
    btnLoader.hidden = !loading;
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
    errorEl.classList.add('shake');
    setTimeout(() => errorEl.classList.remove('shake'), 500);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    const username = $('#input-username').value.trim();
    const password = $('#input-password').value;

    if (!username || !password) {
      showError('Please enter both username and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.message || 'Login failed. Please try again.');
        setLoading(false);
        return;
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      window.location.href = '/admin';
    } catch {
      showError('Network error. Please check your connection.');
      setLoading(false);
    }
  });
})();
