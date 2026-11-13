'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [me, setMe] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (!d) router.push('/login'); else setMe(d);
    });
  }, [router]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  if (!me) return <div className="container"><p className="muted">Loading…</p></div>;

  return (
    <>
      <nav className="nav">
        <strong>TaskEarn</strong>
        <div className="spacer" />
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/watch">Watch ads</Link>
        <Link href="/withdraw">Withdraw</Link>
        <Link href="/refer">Refer</Link>
        <button onClick={logout} style={{ padding: '6px 12px', fontSize: 12, background: 'var(--panel)', border: '1px solid var(--border)', color: 'var(--text)' }}>Log out</button>
      </nav>
      <div className="container">
        <div className="card" style={{ textAlign: 'center' }}>
          <p className="muted" style={{ margin: 0 }}>Available balance</p>
          <div className="balance">${me.balance.toFixed(2)}</div>
          <p className="muted">Min withdrawal: $50.00</p>
        </div>
        <div className="grid grid-3" style={{ marginTop: 16 }}>
          <div className="card">
            <p className="muted" style={{ margin: 0 }}>Today's ad views</p>
            <div style={{ fontSize: 22, marginTop: 8, fontFamily: 'monospace' }}>{me.todayViews || 0}</div>
          </div>
          <div className="card">
            <p className="muted" style={{ margin: 0 }}>Total earned</p>
            <div style={{ fontSize: 22, marginTop: 8, fontFamily: 'monospace' }}>${me.totalEarned?.toFixed(2) || '0.00'}</div>
          </div>
          <div className="card">
            <p className="muted" style={{ margin: 0 }}>Referrals</p>
            <div style={{ fontSize: 22, marginTop: 8, fontFamily: 'monospace' }}>{me.referralCount || 0}</div>
          </div>
        </div>
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Get started</h3>
          <p className="muted">Go to <Link href="/watch">Watch ads</Link> to earn $0.50 per view.</p>
          <p className="muted">Share your referral link from <Link href="/refer">Refer</Link> to earn $5 per signup.</p>
        </div>
      </div>
    </>
  );
}
