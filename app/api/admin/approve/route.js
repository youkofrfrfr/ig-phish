import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { getSession } from '@/lib/session';

export async function POST(req) {
  const s = getSession();
  if (!s || s.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, action } = await req.json();
  if (!id || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const w = await redis.hgetall(`withdraw:${id}`);
  if (!w || w.status !== 'pending') return NextResponse.json({ error: 'Not found or already processed' }, { status: 400 });

  if (action === 'approve') {
    await redis.hset(`withdraw:${id}`, { status: 'approved', approvedAt: Date.now() });
  } else {
    // refund
    await redis.hincrbyfloat(`user:${w.userId}`, 'balance', parseFloat(w.amount));
    await redis.hset(`withdraw:${id}`, { status: 'rejected', rejectedAt: Date.now() });
  }
  await redis.lrem('withdraw:pending', 0, id);

  return NextResponse.json({ ok: true });
}
