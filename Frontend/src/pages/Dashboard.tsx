import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getBalance, topup, getTransactions } from '../api'

export default function Dashboard() {
  const navigate = useNavigate()
  const raw = localStorage.getItem('dmrc_user')
  const user = raw ? JSON.parse(raw) : null

  const [balance, setBalance] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [topupAmount, setTopupAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [tab, setTab] = useState<'wallet' | 'history'>('wallet')

  useEffect(() => {
    if (!user) return
    fetchBalance()
    fetchHistory()
  }, [])

  async function fetchBalance() {
    try { const d = await getBalance(user.user_id); setBalance(d.balance) } catch {}
  }

  async function fetchHistory() {
    try { const d = await getTransactions(user.user_id); setTransactions(d.transactions) } catch {}
  }

  async function handleTopup(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(topupAmount)
    if (!amt || amt <= 0) return
    setLoading(true); setMsg('')
    try {
      const d = await topup(user.user_id, amt)
      setBalance(d.new_balance)
      setMsg(`✅ ₹${amt} added successfully!`)
      setTopupAmount('')
    } catch (err: any) { setMsg(`❌ ${err.message}`) }
    finally { setLoading(false) }
  }

  if (!user) return null

  return (
    <div className="page with-nav">
      <div className="container">
        <div className="flex items-center justify-between mb-2" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem' }}>Welcome, {user.first_name} 👋</h1>
            <p>Manage your wallet and view journey history</p>
          </div>
          <button id="route-planner-dash-btn" className="btn btn-ghost btn-sm" onClick={() => navigate('/route')}>
            🗺️ Plan Route
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid-3 mb-2" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <div className="value text-accent">
              {balance !== null ? `₹${balance.toFixed(2)}` : '…'}
            </div>
            <div className="label">Wallet Balance</div>
          </div>
          <div className="stat-card">
            <div className="value">{transactions.length}</div>
            <div className="label">Total Journeys</div>
          </div>
          <div className="stat-card">
            <div className="value text-green">
              ₹{transactions.reduce((s, t) => s + (t.Fare_amount || 0), 0).toFixed(2)}
            </div>
            <div className="label">Total Spent</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button id="tab-wallet" className={`tab ${tab === 'wallet' ? 'active' : ''}`} onClick={() => setTab('wallet')}>💳 Wallet</button>
          <button id="tab-history" className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>📋 Journey History</button>
        </div>

        {/* Wallet tab */}
        {tab === 'wallet' && (
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Top Up Wallet</h3>
            {msg && (
              <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{msg}</div>
            )}
            <form onSubmit={handleTopup}>
              <div className="form-group">
                <label>Amount (₹)</label>
                <input
                  id="topup-amount"
                  type="number" min="10" step="10"
                  value={topupAmount}
                  onChange={e => setTopupAmount(e.target.value)}
                  placeholder="Enter amount (e.g. 200)"
                />
              </div>
              <div className="flex gap-1 mb-2">
                {[100, 200, 500, 1000].map(a => (
                  <button key={a} type="button" className="btn btn-ghost btn-sm"
                    onClick={() => setTopupAmount(String(a))}>
                    ₹{a}
                  </button>
                ))}
              </div>
              <button id="topup-btn" type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Processing…' : '💳 Add Money'}
              </button>
            </form>
          </div>
        )}

        {/* History tab */}
        {tab === 'history' && (
          <div className="card">
            <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
              <h3>Journey History</h3>
              <button id="refresh-history-btn" className="btn btn-ghost btn-sm" onClick={fetchHistory}>🔄 Refresh</button>
            </div>
            {transactions.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem' }}>No journeys yet. Take your first metro ride!</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Fare</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, i) => (
                      <tr key={t.Transaction_id}>
                        <td><span className="badge badge-blue">{i + 1}</span></td>
                        <td>{t.Source || '—'}</td>
                        <td>{t.Destination || <span className="badge badge-yellow">En Route</span>}</td>
                        <td>{t.Fare_amount != null ? <strong>₹{t.Fare_amount}</strong> : '—'}</td>
                        <td className="text-sm" style={{ color: 'var(--muted)' }}>
                          {t.Transaction_date ? new Date(t.Transaction_date).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
