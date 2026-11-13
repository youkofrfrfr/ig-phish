import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { getSession } from '@/lib/session';

export async function GET() {
  const s = getSession();
  if (!s) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  const keys = await redis.keys('withdraw:*');
  const requests = [];
  for (const k of keys) {
    if (k === 'withdraw:pending') continue;
    const r = await redis.hgetall(k);
    if (r && r.userId === s.id) {
      requests.push({ ...r, amount: (parseInt(r.amountCents) || 0) / 100 });
    }
  }
  requests.sort((a, b) => b.createdAt - a.createdAt);
  return NextResponse.json({ requests });
}
