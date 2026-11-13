import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { getSession } from '@/lib/session';

export async function GET() {
  const s = getSession();
  if (!s) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  const user = await redis.hgetall(`user:${s.id}`);
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // reset daily view counter if new day
  const today = new Date().toISOString().slice(0, 10);
  if (user.lastViewDay !== today) {
    user.todayViews = 0;
    await redis.hset(`user:${s.id}`, { todayViews: 0, lastViewDay: today });
  }

  const { hash, ...safe } = user;
  safe.balance = parseFloat(safe.balance) || 0;
  safe.totalEarned = parseFloat(safe.totalEarned) || 0;
  safe.referralEarned = parseFloat(safe.referralEarned) || 0;
  safe.referralCount = parseInt(safe.referralCount) || 0;
  safe.todayViews = parseInt(safe.todayViews) || 0;
  return NextResponse.json(safe);
}
