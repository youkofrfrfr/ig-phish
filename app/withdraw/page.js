'use client';
import { useEffect, useState } from 'react';

export default function Withdraw() {
  const [method, setMethod] = useState('usdt');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [msg, setMsg] = useState('');
  const [requests, setRequests] = useState([]);
  const [me, setMe] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(setMe);
    fetch('/api/withdraw/list').then(r => r.json()).then(d => setRequests(d.requests || []));
  }, []);

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
    } else {
      setMsg(d.error || 'Failed');
    }
  }

  return (
    <div className="container">
      <h2>Withdraw</h2>
      <div className="grid grid-2">
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>Balance</p>
          <div className="balance">${me?.balance?.toFixed(2) || '0.00'}</div>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
            <select value={method} onChange={e => setMethod(e.target.value)}>
              <option value="usdt">USDT (TRC20)</option>
              <option value="paypal">PayPal</option>
              <option value="bank">Bank transfer</option>
            </select>
            <input placeholder={method === 'usdt' ? 'TRC20 wallet address' : 'Account / email'} value={address} onChange={e => setAddress(e.target.value)} required />
            <input type="number" step="0.01" placeholder="Amount (min $50)" value={amount} onChange={e => setAmount(e.target.value)} min="50" required />
            <button type="submit">Request withdrawal</button>
            {msg && <p className="muted">{msg}</p>}
          </form>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Your requests</h3>
          {requests.length === 0 && <p className="muted">No requests yet.</p>}
          {requests.length > 0 && (
            <table>
              <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Status</th></tr></thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id}>
                    <td className="muted">{new Date(r.createdAt).toLocaleString()}</td>
                    <td>${r.amount.toFixed(2)}</td>
                    <td>{r.method}</td>
                    <td style={{
                      color: r.status === 'approved' ? 'var(--green)' : r.status === 'rejected' ? 'var(--red)' : 'var(--muted)'
                    }}>{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
