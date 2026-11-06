import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/api.js'

const STATUS_UI = {
  pending: { cls: 'status-chip status-chip--pending_approval', label: 'Pending — admin review' },
  approved: { cls: 'status-chip status-chip--approved', label: 'Approved ✓ connected' },
  rejected: { cls: 'status-chip status-chip--rejected', label: 'Rejected' },
}

function fmtDate(v) {
  if (!v) return '—'
  return new Date(v).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export default function MyRequests() {
  const [items, setItems] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = async () => {
    setError('')
    try {
      const data = await api('/requests/sent')
      setItems(data.data.items)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const cancel = async (id) => {
    if (!window.confirm('Cancel this pending request?')) return
    setBusyId(id)
    setError('')
    try {
      await api(`/requests/${id}`, { method: 'DELETE' })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-card requests-page-card">
        <h1 className="dashboard-title">My Requests</h1>
        <p className="page-description">
          Interest requests you sent. The admin reviews every request — you will be
          notified when it is approved or rejected. You can have up to 5 pending requests.
        </p>
        <div className="page-return-link">
          <Link to="/browse" className="btn btn-outline btn-sm">← Browse profiles</Link>
        </div>

        {loading && <div className="page-loading">Loading your requests…</div>}
        {error && <p className="form-error">{error}</p>}

        {!loading && !error && (items || []).length === 0 && (
          <div className="notif-empty">
            <p><strong>No requests sent yet.</strong></p>
            <p>Browse profiles and send interest to someone you like.</p>
          </div>
        )}

        <div className="admin-list">
          {(items || []).map((r) => {
            const ui = STATUS_UI[r.status]
            return (
              <div className="request-row" key={r.id}>
                {r.receiver?.profilePhotoUrl ? (
                  <img className="admin-avatar" src={r.receiver.profilePhotoUrl} alt="" />
                ) : (
                  <div className="admin-avatar">
                    {(r.receiver?.name || '?').slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="request-row-main">
                  <div className="admin-item-name">{r.receiver?.name ?? 'Profile removed'}</div>
                  <div className="admin-item-meta">
                    <span className={ui.cls}>{ui.label}</span>
                    <span>{r.receiver?.age ? `${r.receiver.age} yrs` : ''}</span>
                    <span>{r.receiver?.city || '—'}</span>
                    <span>Sent: {fmtDate(r.createdAt)}</span>
                  </div>
                </div>
                <div className="request-row-actions">
                  {r.receiver?.profileId && (
                    <button type="button" className="btn btn-outline btn-sm"
                      onClick={() => window.location.assign(`/browse/${r.receiver.profileId}`)}>
                      View
                    </button>
                  )}
                  {r.status === 'pending' && (
                    <button type="button" className="btn btn-danger btn-sm" disabled={busyId === r.id}
                      onClick={() => cancel(r.id)}>
                      {busyId === r.id ? 'Cancelling…' : 'Cancel'}
                    </button>
                  )}
                  {r.status === 'approved' && (
                    <Link to="/connections" className="btn btn-primary btn-sm">Open connection</Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
