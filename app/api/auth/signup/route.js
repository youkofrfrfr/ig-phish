import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { redis } from '@/lib/redis';
import { setSession } from '@/lib/session';

function hash(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = crypto.scryptSync(pw, salt, 64).toString('hex');
  return `${salt}:${key}`;
}

export async function POST(req) {
  const { email, username, password, refCode } = await req.json();

  if (!email || !username || !password) {
    return NextResponse.json({ error: 'Email, username, password required' }, { status: 400 });
  }
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return NextResponse.json({ error: 'Username must be 3-20 chars, a-z 0-9 _' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password min 8 chars' }, { status: 400 });
  }

  const normEmail = email.toLowerCase().trim();
  const exists = await redis.hget('users:by_email', normEmail);
  if (exists) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

  const unameExists = await redis.hget('users:by_username', username);
  if (unameExists) return NextResponse.json({ error: 'Username taken' }, { status: 409 });

  const id = crypto.randomBytes(8).toString('hex');
  const user = {
    id,
    email: normEmail,
    username,
    hash: hash(password),
    balance: 1000,        // cents
    totalEarned: 1000,
    referralCount: 0,
    referralEarned: 0,
    todayViews: 0,
    lastViewDay: new Date().toISOString().slice(0, 10),
    referredBy: null,
    role: 'user',
    createdAt: Date.now(),
  };

  // credit referrer by USERNAME
  if (refCode) {
    const refId = await redis.hget('users:by_username', refCode);
    if (refId) {
      user.referredBy = refCode;
      await redis.hincrby(`user:${refId}`, 'balance', 500);
      await redis.hincrby(`user:${refId}`, 'totalEarned', 500);
      await redis.hincrby(`user:${refId}`, 'referralEarned', 500);
      await redis.hincrby(`user:${refId}`, 'referralCount', 1);
    }
  }

  await redis.hset(`user:${id}`, user);
  await redis.hset('users:by_email', { [normEmail]: id });
  await redis.hset('users:by_username', { [username]: id });

  setSession({ id, role: 'user' });
  return NextResponse.json({ ok: true });
}
