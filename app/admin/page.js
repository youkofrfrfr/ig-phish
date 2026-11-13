'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [withdraws, setWithdraws] = useState([]);
  const [tab, setTab] = useState('withdraws');

  async function load() {
    const u = await fetch('/api/admin/users').then(r => r.ok ? r.json() : { users: [] });
    const w = await fetch('/api/admin/withdraws').then(r => r.ok ? r.json() : { withdraws: [] });
    setUsers(u.users || []);
    setWithdraws(w.withdraws || []);
  }
  useEffect(() => { load(); }, []);

  async function act(id, action) {
    await fetch('/api/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    load();
  }

  return (
    <div className="container">
      <h2>Admin panel</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setTab('withdraws')} style={{ background: tab === 'withdraws' ? 'var(--accent)' : 'var(--panel)' }}>Withdrawals ({withdraws.filter(w => w.status === 'pending').length})</button>
        <button onClick={() => setTab('users')} style={{ background: tab === 'users' ? 'var(--accent)' : 'var(--panel)' }}>Users ({users.length})</button>
        <div style={{ flex: 1 }} />
        <button onClick={load} style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}>Refresh</button>
      </div>

      {tab === 'withdraws' && (
        <div className="card">
          <table>
            <thead><tr><th>Date</th><th>User</th><th>Method</th><th>Address</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {withdraws.map(w => (
                <tr key={w.id}>
                  <td className="muted">{new Date(parseInt(w.createdAt)).toLocaleString()}</td>
                  <td>{w.userEmail}</td>
                  <td>{w.method}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{w.address}</td>
                  <td>${parseFloat(w.amount).toFixed(2)}</td>
                  <td>{w.status}</td>
                  <td>
                    {w.status === 'pending' && (
                      <>
                        <button onClick={() => act(w.id, 'approve')} style={{ marginRight: 4, padding: '4px 8px', fontSize: 12, background: 'var(--green)' }}>Approve</button>
                        <button onClick={() => act(w.id, 'reject')} style={{ padding: '4px 8px', fontSize: 12, background: 'var(--red)' }}>Reject</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'users' && (
        <div className="card">
          <table>
            <thead><tr><th>Email</th><th>Balance</th><th>Earned</th><th>Referrals</th><th>Joined</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>${parseFloat(u.balance).toFixed(2)}</td>
                  <td>${parseFloat(u.totalEarned).toFixed(2)}</td>
                  <td>{u.referralCount}</td>
                  <td className="muted">{new Date(parseInt(u.createdAt)).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
                      }
