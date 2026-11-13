'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Watch() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [ads, setAds] = useState([]);
  const [current, setCurrent] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [msg, setMsg] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (!d) router.push('/login'); else setMe(d);
    });
    fetch('/api/ads/list').then(r => r.json()).then(d => setAds(d.ads || []));
  }, [router]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  function openAd(ad) {
    setCurrent(ad);
    setCountdown(ad.durationSec || 15);
    setMsg('');
    window.open(ad.url, '_blank', 'noopener');
    const tick = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(tick);
          completeAd(ad.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function completeAd(id) {
    const r = await fetch('/api/ads/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adId: id }),
    });
    const d = await r.json();
    if (r.ok) {
      setMsg(`+$${d.reward.toFixed(2)} added`);
      setAds(prev => prev.filter(a => a.id !== id));
      setCurrent(null);
      fetch('/api/auth/me').then(r => r.json()).then(setMe);
    } else {
      setMsg(d.error || 'Failed');
      setCurrent(null);
    }
  }

  if (!me) return <div style={{ padding: 40 }} className="muted">Loading…</div>;

  return (
    <div className="shell">
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="side-brand"><div style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff' }}>T</div><span className="side-label">TaskEarn</span></div>
        <nav className="side-nav">
          <Link href="/dashboard" className="side-item"><span className="side-label">Dashboard</span></Link>
          <Link href="/watch" className="side-item active"><span className="side-label">Watch Ads</span></Link>
          <Link href="/withdraw" className="side-item"><span className="side-label">Withdraw</span></Link>
          <Link href="/refer" className="side-item"><span className="side-label">Refer</span></Link>
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
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Watch ads</h1>
          <div style={{ flex: 1 }} />
          <span className="badge badge-success"><span className="badge-dot" />${me.balance.toFixed(2)}</span>
        </div>
        <div className="content">
          <p className="muted">Each completed ad view earns $0.50. Keep the ad tab open for the required duration. Today: {me.todayViews}/20</p>
          {msg && <p style={{ color: 'var(--success)', fontSize: 13 }}>{msg}</p>}
          {current ? (
            <div className="card" style={{ textAlign: 'center', padding: 60 }}>
              <p className="muted">Ad open in new tab. Wait…</p>
              <div className="kpi-value accent mono" style={{ fontSize: 48 }}>{countdown}s</div>
            </div>
          ) : (
            <div className="grid-3">
              {ads.length === 0 && <div className="card"><p className="muted">No ads available right now.</p></div>}
              {ads.map(ad => (
                <div key={ad.id} className="card">
                  <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>{ad.title}</h3>
                  <p className="muted" style={{ margin: '0 0 16px', fontSize: 12 }}>{ad.durationSec || 15}s · $0.50</p>
                  <button onClick={() => openAd(ad)} style={{ width: '100%' }}>Open ad</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
    }
