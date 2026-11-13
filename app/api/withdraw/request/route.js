import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { redis } from '@/lib/redis';
import { getSession } from '@/lib/session';

const MIN = 50;

export async function POST(req) {
  const s = getSession();
  if (!s) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  const { method, address, amount } = await req.json();
  if (!method || !address || !amount) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  if (amount < MIN) return NextResponse.json({ error: `Min $${MIN}` }, { status: 400 });

  const user = await redis.hgetall(`user:${s.id}`);
  const balance = parseFloat(user.balance) || 0;
  if (balance < amount) return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });

  // freeze balance
  await redis.hincrbyfloat(`user:${s.id}`, 'balance', -amount);
  const id = crypto.randomBytes(8).toString('hex');
  const request = {
    id, userId: s.id, userEmail: user.email,
    method, address, amount,
    status: 'pending',
    createdAt: Date.now(),
  };
  await redis.hset(`withdraw:${id}`, request);
  await redis.lpush('withdraw:pending', id);

  return NextResponse.json({ ok: true });
}
