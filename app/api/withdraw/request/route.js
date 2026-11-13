import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { redis } from '@/lib/redis';
import { getSession } from '@/lib/session';

const MIN_CENTS = 5000;

export async function POST(req) {
  const s = getSession();
  if (!s) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  const { method, address, amount } = await req.json();
  if (!method || !address || !amount) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  const cents = Math.round(amount * 100);
  if (cents < MIN_CENTS) return NextResponse.json({ error: 'Min $50' }, { status: 400 });

  const user = await redis.hgetall(`user:${s.id}`);
  const balance = parseInt(user.balance) || 0;
  if (balance < cents) return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });

  await redis.hincrby(`user:${s.id}`, 'balance', -cents);
  const id = crypto.randomBytes(8).toString('hex');
  const request = {
    id, userId: s.id, userEmail: user.email, username: user.username,
    method, address, amountCents: cents,
    status: 'pending',
    createdAt: Date.now(),
  };
  await redis.hset(`withdraw:${id}`, request);
  await redis.lpush('withdraw:pending', id);

  return NextResponse.json({ ok: true });
}
