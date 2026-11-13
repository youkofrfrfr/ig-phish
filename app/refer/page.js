'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Refer() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [copied, setCopied] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (!d) router.push('/login'); else setMe(d);
    });
  }, [router]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  if (!me) return <div style={{ padding: 40 }} className="muted">Loading…</div>;

  const link = typeof window !== 'undefined' ? `${window.location.origin}/signup?ref=${me.username}` : '';

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="shell">
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="side-brand"><div style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff' }}>T</div><span className="side-label">TaskEarn</span></div>
        <nav className="side-nav">
          <Link href="/dashboard" className="side-item"><span className="side-label">Dashboard</span></Link>
          <Link href="/watch" className="side-item"><span className="side-label">Watch Ads</span></Link>
          <Link href="/withdraw" className="side-item"><span className="side-label">Withdraw</span></Link>
          <Link href="/refer" className="side-item active"><span className="side-label">Refer</span></Link>
        </nav>
        <div className="side-footer">
          <div style={{ padding: '8px 4px', marginBottom: 8 }}>
            <div className="side-label" style={{ fontSize: 13, fontWeight: 600 }}>{me.username}</div>
            <div className="side-label tiny" style={{ fontSize: 11 }}>${me.balance.toFixed(2)}</div>
          </div>
          <button onClick={logout} style={{ width: '100%', background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)', fontSize: 13, padding: '8px 12px' }}><span className="side-label">Log out</span></button>
        </div>
      </aside>
      <div className="main-area">
        <div className="topbar">
          <button className="mobile-toggle" onClick={() => setMobileOpen(true)}>☰</button>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Refer</h1>
        </div>
        <div className="content">
          <div className="kpi-grid" style={{ marginBottom: 20 }}>
            <div className="kpi-card"><div className="kpi-label">Referrals</div><div className="kpi-value mono">{me.referralCount}</div></div>
            <div className="kpi-card"><div className="kpi-label">Earned</div><div className="kpi-value accent mono">${me.referralEarned.toFixed(2)}</div></div>
            <div className="kpi-card"><div className="kpi-label">Per signup</div><div className="kpi-value mono">$5.00</div></div>
            <div className="kpi-card"><div className="kpi-label">Your code</div><div className="kpi-value mono" style={{ fontSize: 16, color: 'var(--accent)' }}>{me.username}</div></div>
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0, fontSize: 15 }}>Your referral link</h3>
            <p className="muted">Share this link. You earn $5 for every verified signup.</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <input readOnly value={link} onClick={e => e.target.select()} style={{ fontFamily: 'monospace', fontSize: 13 }} />
              <button onClick={copy} style={{ minWidth: 90 }}>{copied ? 'Copied' : 'Copy'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
