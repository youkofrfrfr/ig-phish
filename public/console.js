// lang: JS, file: public/console.js, target: browser (diagnostics page)
// Hooks console.error/warn/log, window.onerror, unhandledrejection, and wraps
// fetch to log every request's URL + status. Copy-all button dumps everything.
// Optional: ?k=VIEW_KEY auto-runs the /api/logs test on load.

(function () {
  const el = {
    log:      document.getElementById('log'),
    status:   document.getElementById('status'),
    counts:   document.getElementById('counts'),
    testKey:  document.getElementById('testKey'),
    testBtn:  document.getElementById('testBtn'),
    copyBtn:  document.getElementById('copyBtn'),
    clearBtn: document.getElementById('clearBtn'),
    follow:   document.getElementById('followChk'),
  };

  const entries = []; // { ts, kind, text }
  let counts = { error: 0, warn: 0, info: 0, fetch: 0 };

  function tsNow() {
    const d = new Date();
    return d.toTimeString().slice(0, 8) + '.' + String(d.getMilliseconds()).padStart(3, '0');
  }

  function stringify(v) {
    if (typeof v === 'string') return v;
    try { return JSON.stringify(v); } catch { return String(v); }
  }

  function addLine(kind, parts) {
    const ts = tsNow();
    const text = parts.map(stringify).join(' ');
    entries.push({ ts, kind, text });
    counts[kind] = (counts[kind] || 0) + 1;
    renderLine({ ts, kind, text });
    updateCounts();
    if (el.follow.checked) el.log.scrollTop = el.log.scrollHeight;
  }

  function renderLine({ ts, kind, text }) {
    const line = document.createElement('div');
    line.className = 'log-line ' + kind;
    const t = document.createElement('span'); t.className = 't'; t.textContent = ts;
    const tag = document.createElement('span'); tag.className = 'tag ' + kind; tag.textContent = kind;
    const msg = document.createElement('span'); msg.className = 'msg'; msg.textContent = text;
    line.appendChild(t); line.appendChild(tag); line.appendChild(msg);
    el.log.appendChild(line);
  }

  function updateCounts() {
    el.counts.textContent =
      `${counts.error} errors · ${counts.warn} warnings · ${counts.fetch} fetches`;
  }

  function setStatus(s) { el.status.textContent = s; }

  // ---- hook console.* ----
  const orig = { error: console.error, warn: console.warn, log: console.log, info: console.info };
  console.error = function (...a) { addLine('error', a); orig.error.apply(console, a); };
  console.warn  = function (...a) { addLine('warn',  a); orig.warn.apply(console, a); };
  console.info  = function (...a) { addLine('info',  a); orig.info.apply(console, a); };

  // ---- global errors ----
  window.addEventListener('error', (e) => {
    addLine('error', [`${e.message} (${e.filename}:${e.lineno}:${e.colno})`]);
  });
  window.addEventListener('unhandledrejection', (e) => {
    addLine('error', ['unhandled rejection:', e.reason && (e.reason.message || e.reason)]);
  });

  // ---- wrap fetch ----
  const origFetch = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || String(input);
    const method = (init && init.method) || (input && input.method) || 'GET';
    const started = performance.now();
    try {
      const res = await origFetch(input, init);
      const ms = Math.round(performance.now() - started);
      addLine('fetch', [`${method} ${url} -> ${res.status} (${ms}ms)`]);
      if (res.status >= 400) {
        setStatus(`fetch ${res.status}`);
      }
      return res;
    } catch (err) {
      const ms = Math.round(performance.now() - started);
      addLine('error', [`${method} ${url} -> NETWORK ERROR (${ms}ms): ${err.message}`]);
      throw err;
    }
  };

  // ---- test api ----
  async function testApi(key) {
    if (!key) { addLine('error', ['test api: no key entered']); return; }
    setStatus('testing api…');
    addLine('info', ['testing GET /api/logs?k=…&page=0&limit=1']);
    try {
      const r = await fetch(`/api/logs?k=${encodeURIComponent(key)}&page=0&limit=1`, { cache: 'no-store' });
      if (r.status === 404) {
        setStatus('bad key or route');
        addLine('error', ['api returned 404 — key mismatch or route not deployed']);
        return;
      }
      if (r.status === 500) {
        const txt = await r.text().catch(() => '');
        setStatus('api 500');
        addLine('error', ['api returned 500', txt]);
        return;
      }
      if (!r.ok) {
        setStatus(`api ${r.status}`);
        addLine('error', [`api returned ${r.status}`]);
        return;
      }
      const data = await r.json().catch(() => null);
      setStatus('api ok');
      addLine('info', ['api ok:', data]);
    } catch (e) {
      setStatus('api network error');
      addLine('error', ['api fetch threw:', e.message]);
    }
  }

  el.testBtn.addEventListener('click', () => testApi(el.testKey.value.trim()));
  el.testKey.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') el.testBtn.click();
  });

  // ---- copy ----
  el.copyBtn.addEventListener('click', async () => {
    const dump = entries.map(e => `[${e.ts}] ${e.kind.toUpperCase()} ${e.text}`).join('\n');
    try {
      await navigator.clipboard.writeText(dump || '(no entries)');
      el.copyBtn.textContent = 'copied';
    } catch {
      el.copyBtn.textContent = 'failed';
    }
    setTimeout(() => (el.copyBtn.textContent = 'copy all'), 1200);
  });

  // ---- clear ----
  el.clearBtn.addEventListener('click', () => {
    entries.length = 0;
    counts = { error: 0, warn: 0, info: 0, fetch: 0 };
    el.log.innerHTML = '<div class="empty">cleared. waiting for events…</div>';
    updateCounts();
    setStatus('cleared');
  });

  // ---- optional auto-test with ?k= ----
  const url = new URL(location.href);
  const k = url.searchParams.get('k');
  if (k) {
    el.testKey.value = k;
    addLine('info', ['auto-test from ?k= parameter']);
    testApi(k);
  } else {
    addLine('info', ['console ready. events will appear here as they happen.']);
  }

  addLine('info', ['UA: ' + navigator.userAgent]);
  addLine('info', ['URL: ' + location.href]);
})();
