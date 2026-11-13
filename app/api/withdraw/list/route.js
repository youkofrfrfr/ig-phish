import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { getSession } from '@/lib/session';

export async function GET() {
  const s = getSession();
  if (!s) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  // find all withdrawals for this user
  const keys = await redis.keys('withdraw:*');
  const userRequests = [];
  for (const k of keys) {
    if (k === 'withdraw:pending') continue;
    const r = await redis.hgetall(k);
    if (r && r.userId === s.id) userRequests.push(r);
  }
  userRequests.sort((a, b) => b.createdAt - a.createdAt);
  const requests = userRequests.map(r => ({ ...r, amount: parseFloat(r.amount) }));
  return NextResponse.json({ requests });
}
