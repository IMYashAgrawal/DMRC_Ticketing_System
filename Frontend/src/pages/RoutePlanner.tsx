import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { calcRoute, buyTicket, verifyFace } from '../api'

const LINE_COLORS: Record<string, string> = {
  Red: '#ef4444', Yellow: '#eab308', Blue: '#3b82f6',
  Green: '#22c55e', Violet: '#8b5cf6', Pink: '#ec4899',
  Orange: '#f97316', Grey: '#6b7280', Magenta: '#d946ef',
  Aqua: '#06b6d4'
}

export default function RoutePlanner() {
  const navigate = useNavigate()
  const rawUser = localStorage.getItem('dmrc_user')
  const user = rawUser ? JSON.parse(rawUser) : null

  const [source, setSource] = useState('')
  const [dest, setDest] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Ticket checkout state
  const [buying, setBuying] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!source.trim() || !dest.trim()) return
    setLoading(true); setError(''); setSuccessMsg(''); setResult(null); setBuying(false)
    try {
      const data = await calcRoute(source.trim(), dest.trim())
      setResult(data)
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  function swapStations() {
    setSource(dest); setDest(source)
  }

  // --- Purchase Flow ---
  async function initiatePurchase() {
    if (!user) {
      navigate('/login')
      return
    }
    setBuying(true)
    startCamera()
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
      setStreaming(true)
    } catch { setError('Camera access denied.') }
  }

  function cancelPurchase() {
      const stream = videoRef.current?.srcObject as MediaStream
      stream?.getTracks().forEach(t => t.stop())
      setStreaming(false)
      setBuying(false)
      setError('')
  }


  async function captureAndBuy() {
    if (!videoRef.current || !canvasRef.current || !user || !result) return
    const ctx = canvasRef.current.getContext('2d')!
    canvasRef.current.width = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight
    ctx.drawImage(videoRef.current, 0, 0)
    const b64 = canvasRef.current.toDataURL('image/jpeg').split(',')[1]
    
    // stop camera
    const stream = videoRef.current.srcObject as MediaStream
    stream?.getTracks().forEach(t => t.stop())
    setStreaming(false)
    
    setVerifying(true); setError('')
    try {
      // 1. Verify Face
      await verifyFace(user.user_id, b64)
      
      // 2. Buy ticket (deduct fare, add to transactions)
      await buyTicket(user.user_id, result.source, result.destination, result.estimated_fare)
      
      setSuccessMsg("Ticket purchased successfully! You can view it in your dashboard.")
      setBuying(false)
      setResult(null)
      setSource('')
      setDest('')
    } catch (err: any) { 
        setError(err.message) 
        // Restart camera on failure so they can try again
        startCamera()
    }
    finally { setVerifying(false) }
  }


  return (
    <div className="page with-nav">
      <div className="container">
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.8rem' }}>🗺️ Route Planner</h1>
          <p>Find the shortest path between any two DMRC stations</p>
        </div>

        {!buying && (
            <div className="card mb-2" style={{ marginBottom: '1.5rem' }}>
            <form onSubmit={handleSearch}>
                <div className="grid-2">
                <div className="form-group">
                    <label>From Station</label>
                    <input id="source-input" value={source} onChange={e => setSource(e.target.value)}
                    placeholder="e.g. Rajiv Chowk" required />
                </div>
                <div className="form-group">
                    <label>To Station</label>
                    <input id="dest-input" value={dest} onChange={e => setDest(e.target.value)}
                    placeholder="e.g. Hauz Khas" required />
                </div>
                </div>
                <div className="flex gap-1">
                <button id="search-route-btn" type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                    {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Finding Route…</> : '🔍 Find Route'}
                </button>
                <button id="swap-btn" type="button" className="btn btn-ghost btn-sm" style={{ width: 'auto' }} onClick={swapStations}>
                    ⇅ Swap
                </button>
                </div>
            </form>
            </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        {result && !buying && (
          <>
            {/* Summary */}
            <div className="grid-3 mb-2" style={{ marginBottom: '1.2rem' }}>
              <div className="stat-card">
                <div className="value text-accent">₹{result.estimated_fare}</div>
                <div className="label">Estimated Fare</div>
              </div>
              <div className="stat-card">
                <div className="value">{result.distance_km} km</div>
                <div className="label">Distance</div>
              </div>
              <div className="stat-card">
                <div className="value">{result.total_stations}</div>
                <div className="label">Stations</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex" style={{marginBottom: '1rem', gap: '1rem'}}>
              <button 
                id="buy-ticket-btn"
                className="btn btn-success" 
                style={{ flex: 1, padding: '1rem', fontSize: '1.1rem' }} 
                onClick={initiatePurchase}
              >
                💳 Buy Ticket Form Here
              </button>
            </div>

            {/* Route */}
            <div className="card">
              <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
                <h3>Route: {result.source} → {result.destination}</h3>
                <span className="badge badge-green">{result.path?.length} stops</span>
              </div>

              <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                {result.path?.map((station: any, i: number) => {
                  const color = LINE_COLORS[station.color] || '#94a3b8'
                  const isFirst = i === 0
                  const isLast = i === result.path.length - 1
                  return (
                    <div key={i} className="route-step">
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div className="route-dot" style={{
                          background: color,
                          width: isFirst || isLast ? 16 : 12,
                          height: isFirst || isLast ? 16 : 12,
                          boxShadow: isFirst || isLast ? `0 0 8px ${color}` : 'none'
                        }} />
                        {i < result.path.length - 1 && (
                          <div style={{ width: 2, flex: 1, minHeight: 20, background: `${color}55`, marginTop: 2 }} />
                        )}
                      </div>
                      <div style={{ paddingBottom: '.4rem', flex: 1 }}>
                        <div style={{ fontWeight: isFirst || isLast ? 700 : 400, color: isFirst || isLast ? 'var(--text)' : '#cbd5e1' }}>
                          {station.name || `Station ${station.id}`}
                        </div>
                        <div style={{ display: 'flex', gap: '.4rem', marginTop: '.2rem', flexWrap: 'wrap' }}>
                          <span className="badge" style={{
                            background: `${color}22`, color, border: `1px solid ${color}44`,
                            fontSize: '.7rem'
                          }}>
                            {station.color || 'Metro'} Line
                          </span>
                          {isFirst && <span className="badge badge-green" style={{ fontSize: '.7rem' }}>Boarding</span>}
                          {isLast && <span className="badge badge-blue" style={{ fontSize: '.7rem' }}>Destination</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Buying Flow UI */}
        {buying && result && (
            <div className="card">
                 <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
                    <h2>Face Verification to Buy Ticket</h2>
                    <button className="btn btn-ghost btn-sm" onClick={() => cancelPurchase()}>Cancel</button>
                 </div>
                
                 <div style={{ marginBottom: '1.2rem', padding: '1rem', background: 'var(--surface)', borderRadius: '8px' }}>
                    <p style={{marginBottom: 0}}>Purchasing Ticket: <strong>{result.source} → {result.destination}</strong></p>
                    <p style={{marginBottom: 0, marginTop: '4px'}}>Total Fare: <strong className="text-accent">₹{result.estimated_fare}</strong></p>
                 </div>

                 <div className="webcam-box" style={{ marginBottom: '1rem' }}>
                    {!streaming && <div className="placeholder">📷 Starting camera…</div>}
                     <video ref={videoRef} style={{ display: streaming ? 'block' : 'none' }} />
                     <canvas ref={canvasRef} style={{ display: 'none' }} />
                 </div>

                {!streaming && !verifying && (
                    <button id="retry-camera-btn" type="button" className="btn btn-ghost mb-2" onClick={startCamera}>📷 Restart Camera</button>
                )}

                 <button 
                    className="btn btn-success" 
                    onClick={captureAndBuy} 
                    disabled={verifying || !streaming}
                    style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                >
                    {verifying ? 'Verifying & Processing Payment...' : '📸 Verify Face & Pay ₹' + result.estimated_fare}
                 </button>
            </div>
        )}
      </div>
    </div>
  )
}
