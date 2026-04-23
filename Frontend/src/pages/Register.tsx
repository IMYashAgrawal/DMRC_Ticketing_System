import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { register } from '../api'

export default function Register() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [streaming, setStreaming] = useState(false)
  const [captured, setCaptured] = useState<string | null>(null)
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone_no: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function setField(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
      setStreaming(true)
    } catch { setError('Camera access denied. Please allow camera in your browser.') }
  }

  function capture() {
    if (!videoRef.current || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')!
    canvasRef.current.width = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight
    ctx.drawImage(videoRef.current, 0, 0)
    const b64 = canvasRef.current.toDataURL('image/jpeg').split(',')[1]
    setCaptured(b64)
    // stop camera
    const stream = videoRef.current.srcObject as MediaStream
    stream?.getTracks().forEach(t => t.stop())
    setStreaming(false)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!captured) { setError('Please capture your face photo first.'); return }
    setLoading(true); setError(''); setSuccess('')
    try {
      const res = await register({ ...form, face_image_b64: captured })
      setSuccess(`Registered! Your user ID is ${res.user_id}. Redirecting to login…`)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="page with-nav" style={{ justifyContent: 'center' }}>
      <div className="narrow">
        <div className="card">
          <h2 style={{ marginBottom: '.3rem' }}>Create Account</h2>
          <p style={{ marginBottom: '1.5rem', fontSize: '.88rem' }}>
            Already registered? <span className="text-accent cursor-pointer" onClick={() => navigate('/login')}>Sign in →</span>
          </p>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={submit}>
            <div className="grid-2">
              <div className="form-group">
                <label>First Name</label>
                <input id="reg-first-name" name="first_name" value={form.first_name} onChange={setField} placeholder="Yash" required />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input id="reg-last-name" name="last_name" value={form.last_name} onChange={setField} placeholder="Agrawal" required />
              </div>
            </div>
            <div className="form-group">
              <label>Email</label>
              <input id="reg-email" name="email" type="email" value={form.email} onChange={setField} placeholder="you@email.com" required />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input id="reg-phone" name="phone_no" value={form.phone_no} onChange={setField} placeholder="9876543210" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input id="reg-password" name="password" type="password" value={form.password} onChange={setField} placeholder="••••••••" required />
            </div>

            <hr className="divider" />
            <label style={{ fontSize: '.85rem', color: '#94a3b8', fontWeight: 500, marginBottom: '.5rem', display: 'block' }}>Face Photo</label>

            <div className="webcam-box" style={{ marginBottom: '1rem' }}>
              {!streaming && !captured && <div className="placeholder">📷 Click "Start Camera" to capture your face</div>}
              <video ref={videoRef} style={{ display: streaming ? 'block' : 'none' }} />
              <canvas ref={canvasRef} style={{ display: captured && !streaming ? 'block' : 'none' }} />
            </div>

            <div className="flex gap-1 mb-2">
              {!streaming && !captured && (
                <button id="start-camera-btn" type="button" className="btn btn-ghost" onClick={startCamera}>📷 Start Camera</button>
              )}
              {streaming && (
                <button id="capture-btn" type="button" className="btn btn-success" onClick={capture}>✅ Capture Photo</button>
              )}
              {captured && (
                <button id="retake-btn" type="button" className="btn btn-ghost" onClick={() => { setCaptured(null); startCamera() }}>🔁 Retake</button>
              )}
            </div>

            <button id="register-submit-btn" type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Registering…</> : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
