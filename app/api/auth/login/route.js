import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { redis } from '@/lib/redis';
import { setSession } from '@/lib/session';

function check(pw, stored) {
  const [salt, key] = stored.split(':');
  const expect = crypto.scryptSync(pw, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(expect, 'hex'));
}

export async function POST(req) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const id = await redis.hget('users:by_email', email.toLowerCase().trim());
  if (!id) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const user = await redis.hgetall(`user:${id}`);
  if (!user || !check(password, user.hash)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  setSession({ id, role: user.role || 'user' });
  return NextResponse.json({ ok: true, role: user.role || 'user' });
}
