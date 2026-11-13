import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { getSession } from '@/lib/session';

export async function GET() {
  const s = getSession();
  if (!s || s.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const ids = await redis.keys('user:*');
  const users = [];
  for (const k of ids) {
    if (k === 'users:by_email' || k === 'users:by_ref') continue;
    const u = await redis.hgetall(k);
    if (u && u.id) users.push({ ...u, hash: undefined });
  }
  users.sort((a, b) => b.createdAt - a.createdAt);
  return NextResponse.json({ users });
}
