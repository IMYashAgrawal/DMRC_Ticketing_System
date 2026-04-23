import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, verifyFace } from '../api'

export default function Login() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [step, setStep] = useState<1 | 2>(1)
  const [userId, setUserId] = useState<number | null>(null)
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  /* ── Step 1: Password ── */
  async function submitPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await login(email, password)
      setUserId(res.user_id); setFirstName(res.first_name)
      setStep(2)
      setTimeout(startCamera, 300)
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  /* ── Step 2: Face ── */
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
      setStreaming(true)
    } catch { setError('Camera access denied.') }
  }

  async function captureAndVerify() {
    if (!videoRef.current || !canvasRef.current || !userId) return
    const ctx = canvasRef.current.getContext('2d')!
    canvasRef.current.width = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight
    ctx.drawImage(videoRef.current, 0, 0)
    const b64 = canvasRef.current.toDataURL('image/jpeg').split(',')[1]
    const stream = videoRef.current.srcObject as MediaStream
    stream?.getTracks().forEach(t => t.stop())
    setStreaming(false)
    setLoading(true); setError('')
    try {
      await verifyFace(userId, b64)
      localStorage.setItem('dmrc_user', JSON.stringify({ user_id: userId, first_name: firstName }))
      navigate('/dashboard')
    } catch (err: any) { setError(err.message); setStreaming(false) }
    finally { setLoading(false) }
  }

  return (
    <div className="page with-nav" style={{ justifyContent: 'center' }}>
      <div className="narrow">
        <div className="card">
          {/* Step indicator */}
          <div className="flex gap-1 mb-2" style={{ marginBottom: '1.5rem' }}>
            {[{ n: 1, label: 'Password' }, { n: 2, label: 'Face Scan' }].map(s => (
              <div key={s.n} className="flex items-center gap-1" style={{ flex: 1 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.82rem',
                  background: step >= s.n ? 'var(--accent)' : 'var(--border)',
                  color: step >= s.n ? '#fff' : 'var(--muted)', flexShrink: 0
                }}>{s.n}</div>
                <span style={{ fontSize: '.82rem', color: step === s.n ? 'var(--text)' : 'var(--muted)' }}>{s.label}</span>
              </div>
            ))}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {/* ── Step 1 ── */}
          {step === 1 && (
            <>
              <h2 style={{ marginBottom: '.3rem' }}>Welcome back</h2>
              <p style={{ marginBottom: '1.5rem', fontSize: '.88rem' }}>
                New here? <span className="text-accent cursor-pointer" onClick={() => navigate('/register')}>Create an account →</span>
              </p>
              <form onSubmit={submitPassword}>
                <div className="form-group">
                  <label>Email</label>
                  <input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" required />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                </div>
                <button id="login-submit-btn" type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Verifying…' : 'Continue →'}
                </button>
              </form>
            </>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <>
              <h2 style={{ marginBottom: '.3rem' }}>Face Verification</h2>
              <p style={{ marginBottom: '1.2rem', fontSize: '.88rem' }}>
                Hi {firstName}! Look straight into the camera and click Verify.
              </p>
              <div className="webcam-box" style={{ marginBottom: '1rem' }}>
                {!streaming && <div className="placeholder">📷 Starting camera…</div>}
                <video ref={videoRef} style={{ display: streaming ? 'block' : 'none' }} />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>
              {!streaming && !loading && (
                <button id="retry-camera-btn" type="button" className="btn btn-ghost mb-2" onClick={startCamera}>📷 Start Camera</button>
              )}
              <button id="verify-face-btn" type="button" className="btn btn-primary" onClick={captureAndVerify} disabled={loading || !streaming}>
                {loading ? 'Verifying face…' : '✅ Verify Face & Login'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
