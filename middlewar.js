import { NextResponse } from 'next/server';
import { verify } from './lib/session';

export function middleware(req) {
  const token = req.cookies.get('session')?.value;
  const session = verify(token);
  const { pathname } = req.nextUrl;

  const protectedPaths = ['/dashboard', '/watch', '/withdraw', '/refer', '/admin'];
  const isProtected = protectedPaths.some(p => pathname.startsWith(p));

  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (pathname.startsWith('/admin') && session?.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*', '/watch/:path*', '/withdraw/:path*', '/refer/:path*', '/admin/:path*'] };
