import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { getSession } from '@/lib/session';

export async function GET() {
  const s = getSession();
  if (!s) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  const user = await redis.hgetall(`user:${s.id}`);
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const today = new Date().toISOString().slice(0, 10);
  if (user.lastViewDay !== today) {
    user.todayViews = 0;
    await redis.hset(`user:${s.id}`, { todayViews: 0, lastViewDay: today });
  }

  const { hash, ...safe } = user;
  safe.balance = (parseInt(safe.balance) || 0) / 100;
  safe.totalEarned = (parseInt(safe.totalEarned) || 0) / 100;
  safe.referralEarned = (parseInt(safe.referralEarned) || 0) / 100;
  safe.referralCount = parseInt(safe.referralCount) || 0;
  safe.todayViews = parseInt(safe.todayViews) || 0;
  return NextResponse.json(safe);
}
