'use client';
import { useEffect, useState } from 'react';

export default function Refer() {
  const [me, setMe] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(setMe);
  }, []);

  if (!me) return <div className="container"><p className="muted">Loading…</p></div>;

  const link = typeof window !== 'undefined' ? `${window.location.origin}/signup?ref=${me.refCode}` : '';

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="container">
      <h2>Refer</h2>
      <div className="card">
        <p className="muted">Share this link. You earn $5 for every verified signup.</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <input readOnly value={link} onClick={e => e.target.select()} />
          <button onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
        </div>
        <p className="muted" style={{ marginTop: 16 }}>
          Total referrals: <strong>{me.referralCount || 0}</strong> · Earned from referrals: <strong>${(me.referralEarned || 0).toFixed(2)}</strong>
        </p>
      </div>
    </div>
  );
}
