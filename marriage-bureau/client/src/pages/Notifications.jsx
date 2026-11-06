import { useEffect, useState } from 'react'
import { api } from '../api/api.js'

function timeAgo(iso) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hr${h === 1 ? '' : 's'} ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d} day${d === 1 ? '' : 's'} ago`
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Notifications() {
  const [items, setItems] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyAll, setBusyAll] = useState(false)

  const unread = (items || []).filter((n) => !n.isRead).length

  const load = async () => {
    setError('')
    try {
      const data = await api('/notifications')
      setItems(data.data.items)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const markRead = async (id) => {
    const target = items.find((n) => n.id === id)
    if (!target || target.isRead) return
    setItems((list) => list.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    try {
      await api(`/notifications/${id}/read`, { method: 'POST' })
    } catch (err) {
      setError(err.message)
      setItems((list) => list.map((n) => (n.id === id ? { ...n, isRead: false } : n)))
    }
  }

  const markAll = async () => {
    setBusyAll(true)
    setError('')
    try {
      await api('/notifications/read-all', { method: 'POST' })
      setItems((list) => list.map((n) => ({ ...n, isRead: true })))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyAll(false)
    }
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-card" style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1 className="dashboard-title">Notifications</h1>

        <div className="notif-toolbar">
          <button type="button" className="btn btn-outline btn-sm" disabled={busyAll || unread === 0} onClick={markAll}>
            {busyAll ? 'Please wait…' : `Mark all read${unread ? ` (${unread})` : ''}`}
          </button>
        </div>

        {loading && <div className="page-loading">Loading notifications…</div>}
        {error && <p className="form-error">{error}</p>}

        {!loading && !error && (
          items.length === 0 ? (
            <div className="notif-empty">
              <p><strong>No notifications yet.</strong></p>
              <p>You will be notified here when your profile is reviewed,
                someone shows interest, or a match is approved.</p>
            </div>
          ) : (
            <div className="notif-list">
              {items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={`notif-item ${n.isRead ? 'read' : 'unread'}`}
                  onClick={() => markRead(n.id)}
                  title={n.isRead ? 'Read' : 'Click to mark as read'}
                >
                  <span className="notif-dot" aria-hidden="true" />
                  <span className="notif-body">
                    <span className="notif-title">{n.title}</span>
                    <span className="notif-message" style={{ display: 'block' }}>{n.message}</span>
                  </span>
                  <span className="notif-time">{timeAgo(n.createdAt)}</span>
                </button>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
