import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { getSession } from '@/lib/session';

export async function GET() {
  const s = getSession();
  if (!s) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  const raw = await redis.lrange('ads:pool', 0, 49);
  const ads = raw.map(x => { try { return JSON.parse(x); } catch { return null; } }).filter(Boolean);

  // filter out already-watched today
  const today = new Date().toISOString().slice(0, 10);
  const watchedKey = `user:${s.id}:watched:${today}`;
  const watched = await redis.smembers(watchedKey);

  const available = ads.filter(a => !watched.includes(a.id));
  return NextResponse.json({ ads: available });
}
