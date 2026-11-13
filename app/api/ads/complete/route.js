import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { getSession } from '@/lib/session';

const REWARD_CENTS = 50;
const DAILY_CAP = 20;

export async function POST(req) {
  const s = getSession();
  if (!s) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  const { adId } = await req.json();
  if (!adId) return NextResponse.json({ error: 'Missing adId' }, { status: 400 });

  const today = new Date().toISOString().slice(0, 10);
  const watchedKey = `user:${s.id}:watched:${today}`;
  const already = await redis.sismember(watchedKey, adId);
  if (already) return NextResponse.json({ error: 'Already viewed today' }, { status: 400 });

  const user = await redis.hgetall(`user:${s.id}`);
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (user.lastViewDay !== today) {
    await redis.hset(`user:${s.id}`, { todayViews: 0, lastViewDay: today });
    user.todayViews = 0;
  }
  if (parseInt(user.todayViews) >= DAILY_CAP) {
    return NextResponse.json({ error: 'Daily cap reached' }, { status: 429 });
  }

  await redis.sadd(watchedKey, adId);
  await redis.expire(watchedKey, 86400 * 2);
  await redis.hincrby(`user:${s.id}`, 'balance', REWARD_CENTS);
  await redis.hincrby(`user:${s.id}`, 'totalEarned', REWARD_CENTS);
  await redis.hincrby(`user:${s.id}`, 'todayViews', 1);

  return NextResponse.json({ ok: true, reward: REWARD_CENTS / 100 });
}
