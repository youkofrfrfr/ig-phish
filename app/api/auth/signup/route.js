import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { redis } from '@/lib/redis';
import { setSession } from '@/lib/session';

function hash(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = crypto.scryptSync(pw, salt, 64).toString('hex');
  return `${salt}:${key}`;
}

function genRefCode() {
  return crypto.randomBytes(4).toString('hex');
}

export async function POST(req) {
  const { email, password, refCode } = await req.json();
  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: 'Email + password (8+) required' }, { status: 400 });
  }

  const normEmail = email.toLowerCase().trim();
  const exists = await redis.hget('users:by_email', normEmail);
  if (exists) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

  const id = crypto.randomBytes(8).toString('hex');
  const myRef = genRefCode();
  const user = {
    id,
    email: normEmail,
    hash: hash(password),
    balance: 10,
    totalEarned: 10,
    referralCount: 0,
    referralEarned: 0,
    todayViews: 0,
    lastViewDay: new Date().toISOString().slice(0, 10),
    refCode: myRef,
    referredBy: refCode || null,
    role: 'user',
    createdAt: Date.now(),
  };

  await redis.hset(`user:${id}`, user);
  await redis.hset('users:by_email', { [normEmail]: id });
  await redis.hset('users:by_ref', { [myRef]: id });

  // give referrer $5
  if (refCode) {
    const refId = await redis.hget('users:by_ref', refCode);
    if (refId) {
      await redis.hincrby(`user:${refId}`, 'balance', 5);
      await redis.hincrby(`user:${refId}`, 'totalEarned', 5);
      await redis.hincrby(`user:${refId}`, 'referralEarned', 5);
      await redis.hincrby(`user:${refId}`, 'referralCount', 1);
    }
  }

  setSession({ id, role: 'user' });
  return NextResponse.json({ ok: true });
}
