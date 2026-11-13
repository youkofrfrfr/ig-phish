'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function Sidebar({ user, active, logout, mobileOpen, closeMobile }) {
  const items = [
    { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { key: 'watch', label: 'Watch Ads', href: '/watch', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { key: 'withdraw', label: 'Withdraw', href: '/withdraw', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { key: 'refer', label: 'Refer', href: '/refer', icon: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4z' },
  ];
  if (user?.role === 'admin') {
    items.push({ key: 'admin', label: 'Admin', href: '/admin', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' });
  }

  return (
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="side-brand">
        <div style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff' }}>T</div>
        <span className="side-label">TaskEarn</span>
      </div>
      <nav className="side-nav">
        {items.map(item => (
          <Link key={item.key} href={item.href} className={`side-item ${active === item.key ? 'active' : ''}`} onClick={closeMobile}>
            <svg className="side-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
            </svg>
            <span className="side-label">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="side-footer">
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, background: 'var(--surface-3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>
              {user.username?.[0] || 'U'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="side-label" style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.username}</div>
              <div className="side-label tiny" style={{ fontSize: 11 }}>${user.balance?.toFixed(2)}</div>
            </div>
          </div>
        )}
        <button onClick={logout} style={{ width: '100%', background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)', fontSize: 13, padding: '8px 12px' }}>
          <span className="side-label">Log out</span>
        </button>
      </div>
    </aside>
  );
}

function Badge({ status }) {
  const cls = status === 'approved' ? 'badge-success' : status === 'rejected' ? 'badge-error' : 'badge-warning';
  return <span className={`badge ${cls}`}><span className="badge-dot" />{status}</span>;
}

export default function Dashboard() {
  const router = useRouter();
  const [me, setMe] = useState(null);
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

  return (
    <div className="shell">
      <Sidebar user={me} active="dashboard" logout={logout} mobileOpen={mobileOpen} closeMobile={() => setMobileOpen(false)} />
      <div className="main-area">
        <div className="topbar">
          <button className="mobile-toggle" onClick={() => setMobileOpen(true)}>☰</button>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Dashboard</h1>
          <div style={{ flex: 1 }} />
          <Link href="/watch"><button style={{ fontSize: 13, padding: '8px 14px' }}>Earn now</button></Link>
        </div>
        <div className="content">
          <div className="kpi-grid" style={{ marginBottom: 20 }}>
            <div className="kpi-card">
              <div className="kpi-label">Balance</div>
              <div className="kpi-value accent mono">${me.balance.toFixed(2)}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Today's Views</div>
              <div className="kpi-value mono">{me.todayViews} <span className="tiny" style={{ fontSize: 14, fontWeight: 400 }}>/ 20</span></div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Total Earned</div>
              <div className="kpi-value mono">${me.totalEarned.toFixed(2)}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Referrals</div>
              <div className="kpi-value mono">{me.referralCount}</div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <h3 style={{ marginTop: 0, fontSize: 15 }}>Quick actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                <Link href="/watch" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 8, color: 'var(--text-primary)' }}>
                  <span>Watch ads</span><span className="mono tiny">+$0.50/view</span>
                </Link>
                <Link href="/refer" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 8, color: 'var(--text-primary)' }}>
                  <span>Invite friends</span><span className="mono tiny">+$5/signup</span>
                </Link>
                <Link href="/withdraw" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 8, color: 'var(--text-primary)' }}>
                  <span>Withdraw</span><span className="mono tiny">min $50</span>
                </Link>
              </div>
            </div>
            <div className="card">
              <h3 style={{ marginTop: 0, fontSize: 15 }}>Account</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="muted">Username</span>
                  <span className="mono">{me.username}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="muted">Email</span>
                  <span className="mono" style={{ fontSize: 12 }}>{me.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="muted">Referred by</span>
                  <span className="mono">{me.referredBy || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="muted">Joined</span>
                  <span className="mono">{new Date(parseInt(me.createdAt)).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
    }
