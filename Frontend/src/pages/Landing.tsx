import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()
  return (
    <div className="page with-nav">
      <div className="container">
        <div className="hero-section">
          <div className="hero-badge">🚇 Delhi Metro · Smart Ticketing</div>
          <h1>Travel smarter with<br /><span>face-based ticketing</span></h1>
          <p style={{ fontSize: '1.05rem', maxWidth: 520, margin: '0 auto 2rem' }}>
            Register once, scan your face at the gate. No cards, no queues.
            DMRC Smart Ticketing uses biometric authentication for a seamless metro experience.
          </p>
          <div className="flex gap-1" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
            <button id="get-started-btn" className="btn btn-primary" style={{ width: 'auto', padding: '.8rem 2rem' }} onClick={() => navigate('/register')}>
              Get Started →
            </button>
            <button id="route-planner-btn" className="btn btn-ghost" style={{ width: 'auto', padding: '.8rem 2rem' }} onClick={() => navigate('/route')}>
              Plan a Route
            </button>
          </div>
        </div>

        <div className="feature-cards">
          {[
            { icon: '🔐', title: 'Face Authentication', desc: 'Two-factor: password + live face scan for secure, keyless entry.' },
            { icon: '🗺️', title: 'Smart Route Planner', desc: 'Dijkstra-powered shortest path across all 248 DMRC stations.' },
            { icon: '💳', title: 'Digital Wallet', desc: 'Top up your metro wallet and auto-pay fare on exit.' },
            { icon: '📊', title: 'Journey History', desc: 'Every trip logged with source, destination and fare.' },
          ].map(f => (
            <div className="feature-card" key={f.title}>
              <div className="icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p style={{ fontSize: '.85rem', marginTop: '.3rem' }}>{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="card mt-3" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <p style={{ color: '#94a3b8' }}>
            Already have an account?{' '}
            <span className="text-accent cursor-pointer" onClick={() => navigate('/login')}>
              Sign in →
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
