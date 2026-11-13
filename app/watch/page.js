'use client';
import { useEffect, useState } from 'react';

export default function Watch() {
  const [ads, setAds] = useState([]);
  const [current, setCurrent] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/ads/list').then(r => r.json()).then(d => setAds(d.ads || []));
  }, []);

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
      setMsg(`+$${d.reward?.toFixed(2) || '0.50'} added`);
      setAds(prev => prev.filter(a => a.id !== id));
      setCurrent(null);
    } else {
      setMsg(d.error || 'Failed');
    }
  }

  return (
    <div className="container">
      <h2>Watch ads</h2>
      <p className="muted">Each completed ad view earns $0.50. Keep the ad tab open for the required duration.</p>
      {msg && <p style={{ color: 'var(--green)' }}>{msg}</p>}
      {current ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p>Ad open in new tab. Wait {countdown}s…</p>
          <div className="balance">{countdown}s</div>
        </div>
      ) : (
        <div className="grid grid-2">
          {ads.length === 0 && <p className="muted">No ads available right now. Check back later.</p>}
          {ads.map(ad => (
            <div key={ad.id} className="card">
              <h3 style={{ margin: '0 0 8px' }}>{ad.title}</h3>
              <p className="muted" style={{ margin: '0 0 12px' }}>Duration: {ad.durationSec || 15}s · Reward: $0.50</p>
              <button onClick={() => openAd(ad)}>Open ad</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
