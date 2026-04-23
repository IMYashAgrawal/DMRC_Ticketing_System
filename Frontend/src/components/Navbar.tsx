import { useNavigate, useLocation } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const raw = localStorage.getItem('dmrc_user')
  const user = raw ? JSON.parse(raw) : null

  function logout() {
    localStorage.removeItem('dmrc_user')
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <span className="metro-dot" />
        DMRC Smart Ticketing
      </div>

      <div className="navbar-links">
        <button className={`nav-link ${pathname === '/route' ? 'active' : ''}`} onClick={() => navigate('/route')}>
          🗺️ Route Planner
        </button>

        {user ? (
          <>
            <button className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`} onClick={() => navigate('/dashboard')}>
              👤 {user.first_name}
            </button>
            <button className="nav-link" onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <button className="nav-link" onClick={() => navigate('/login')}>Login</button>
            <button className="nav-link highlight" onClick={() => navigate('/register')}>Register</button>
          </>
        )}
      </div>
    </nav>
  )
}
