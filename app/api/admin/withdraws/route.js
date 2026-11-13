import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { getSession } from '@/lib/session';

export async function GET() {
  const s = getSession();
  if (!s || s.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const ids = await redis.lrange('withdraw:pending', 0, 99);
  const withdraws = [];
  for (const id of ids) {
    const w = await redis.hgetall(`withdraw:${id}`);
    if (w) withdraws.push(w);
  }
  return NextResponse.json({ withdraws });
}
