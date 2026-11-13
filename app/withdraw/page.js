'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function Badge({ status }) {
  const cls = status === 'approved' ? 'badge-success' : status === 'rejected' ? 'badge-error' : 'badge-warning';
  return <span className={`badge ${cls}`}><span className="badge-dot" />{status}</span>;
}

export default function Withdraw() {
  const router = useRouter();
  const [method, setMethod] = useState('usdt');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [msg, setMsg] = useState('');
  const [requests, setRequests] = useState([]);
  const [me, setMe] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (!d) router.push('/login'); else setMe(d);
    });
    fetch('/api/withdraw/list').then(r => r.json()).then(d => setRequests(d.requests || []));
  }, [router]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    const r = await fetch('/api/withdraw/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, address, amount: parseFloat(amount) }),
    });
    const d = await r.json();
    if (r.ok) {
      setMsg('Request submitted. Admin will review.');
      setAmount(''); setAddress('');
      fetch('/api/withdraw/list').then(r => r.json()).then(d => setRequests(d.requests || []));
      fetch('/api/auth/me').then(r => r.json()).then(setMe);
    } else {
      setMsg(d.error || 'Failed');
    }
  }

  if (!me) return <div style={{ padding: 40 }} className="muted">Loading…</div>;

  return (
    <div className="shell">
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="side-brand"><div style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff' }}>T</div><span className="side-label">TaskEarn</span></div>
        <nav className="side-nav">
          <Link href="/dashboard" className="side-item"><span className="side-label">Dashboard</span></Link>
          <Link href="/watch" className="side-item"><span className="side-label">Watch Ads</span></Link>
          <Link href="/withdraw" className="side-item active"><span className="side-label">Withdraw</span></Link>
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
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Withdraw</h1>
        </div>
        <div className="content">
          <div className="kpi-grid" style={{ marginBottom: 20 }}>
            <div className="kpi-card"><div className="kpi-label">Balance</div><div className="kpi-value accent mono">${me.balance.toFixed(2)}</div></div>
            <div className="kpi-card"><div className="kpi-label">Min withdrawal</div><div className="kpi-value mono">$50</div></div>
          </div>
          <div className="grid-2">
            <div className="card">
              <h3 style={{ marginTop: 0, fontSize: 15 }}>Request withdrawal</h3>
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                <select value={method} onChange={e => setMethod(e.target.value)}>
                  <option value="usdt">USDT (TRC20)</option>
                  <option value="paypal">PayPal</option>
                  <option value="bank">Bank transfer</option>
                </select>
                <input placeholder={method === 'usdt' ? 'TRC20 wallet address' : 'Account / email'} value={address} onChange={e => setAddress(e.target.value)} required />
                <input type="number" step="0.01" placeholder="Amount (min $50)" value={amount} onChange={e => setAmount(e.target.value)} min="50" required />
                <button type="submit">Request withdrawal</button>
                {msg && <p className="muted" style={{ margin: 0 }}>{msg}</p>}
              </form>
            </div>
            <div className="card">
              <h3 style={{ marginTop: 0, fontSize: 15 }}>History</h3>
              {requests.length === 0 ? <p className="muted">No requests yet.</p> : (
                <table className="table">
                  <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Status</th></tr></thead>
                  <tbody>
                    {requests.map(r => (
                      <tr key={r.id}>
                        <td className="muted tiny">{new Date(parseInt(r.createdAt)).toLocaleDateString()}</td>
                        <td className="mono">${r.amount.toFixed(2)}</td>
                        <td className="tiny" style={{ textTransform: 'uppercase' }}>{r.method}</td>
                        <td><Badge status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
