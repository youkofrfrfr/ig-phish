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
    setCount
