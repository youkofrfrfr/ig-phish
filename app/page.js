import Link from 'next/link';

export default function Home() {
  return (
    <>
      <nav className="nav">
        <strong>TaskEarn</strong>
        <div className="spacer" />
        <Link href="/login">Log in</Link>
        <Link href="/signup">Sign up</Link>
      </nav>
      <div className="container">
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <h1 style={{ fontSize: 42, margin: 0 }}>Watch ads. Earn rewards.</h1>
          <p className="muted" style={{ fontSize: 16, marginTop: 12 }}>
            Get $10 on signup. $5 per verified referral. $0.50 per completed ad view.
          </p>
          <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link href="/signup"><button style={{ fontSize: 16, padding: '12px 24px' }}>Create account</button></Link>
            <Link href="/login"><button style={{ fontSize: 16, padding: '12px 24px', background: 'var(--panel)', border: '1px solid var(--border)' }}>Log in</button></Link>
          </div>
        </div>
        <div className="grid grid-3" style={{ marginTop: 40 }}>
          <div className="card">
            <h3>1. Sign up</h3>
            <p className="muted">Create your account in under a minute. Get $10 bonus balance.</p>
          </div>
          <div className="card">
            <h3>2. Watch ads</h3>
            <p className="muted">Each ad view is worth $0.50. Complete them daily.</p>
          </div>
          <div className="card">
            <h3>3. Withdraw</h3>
            <p className="muted">Request payout to USDT, PayPal, or bank transfer once balance reaches $50.</p>
          </div>
        </div>
      </div>
    </>
  );
}
