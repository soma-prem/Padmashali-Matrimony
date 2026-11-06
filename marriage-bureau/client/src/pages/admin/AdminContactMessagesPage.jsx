import { useEffect, useState } from 'react'
import { api, toast } from '../../api/api.js'

const TABS = [
  { value: 'open', label: 'Open' },
  { value: 'handled', label: 'Handled' },
  { value: 'all', label: 'All' },
]

function fmt(v) {
  if (!v) return '—'
  return new Date(v).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export default function AdminContactMessagesPage() {
  const [tab, setTab] = useState('open')
  const [items, setItems] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api(`/admin/messages?filter=${tab}`)
      setItems(data.data.items)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleHandled = async (msg) => {
    const target = !msg.is_handled
    setBusyId(msg.id)
    try {
      await api(`/admin/messages/${msg.id}/handled`, {
        method: 'PATCH',
        body: { isHandled: target },
      })
      toast.success(target ? 'Marked as handled.' : 'Marked as open.')
      await load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <h1 className="dashboard-title" style={{ marginBottom: 12 }}>Contact Messages</h1>
      <p style={{ fontSize: 14, marginBottom: 14 }}>
        Messages sent by visitors through the <strong>Contact Us</strong> page.
        Reply by email/phone — every message carries the sender's contact.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button key={t.value} type="button"
            className={`btn btn-sm ${tab === t.value ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setTab(t.value)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="page-loading"><span className="spinner" /></div>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && (items || []).length === 0 && (
        <div className="notifications-empty">No {tab === 'all' ? '' : tab + ' '}messages.</div>
      )}

      <div className="admin-list">
        {(items || []).map((m) => (
          <div className="request-row" key={m.id} style={{ alignItems: 'flex-start' }}>
            <div className="request-row-main">
              <div className="admin-item-name">
                {m.name}
                {!m.is_handled && <span className="inactive-tag" style={{ marginLeft: 8 }}>New</span>}
              </div>
              <div className="admin-item-mail">
                ✉ {m.email}{m.phone ? ` • ☎ ${m.phone}` : ''}
              </div>
              {m.subject && <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>{m.subject}</div>}
              <div style={{ fontSize: 14, marginTop: 4, whiteSpace: 'pre-wrap' }}>{m.message}</div>
              <div className="admin-item-meta" style={{ marginTop: 6 }}>
                <span>Sent: {fmt(m.created_at)}</span>
                <span className={m.is_handled ? 'status-chip status-chip--approved' : 'status-chip status-chip--pending_approval'}>
                  {m.is_handled ? 'handled' : 'open'}
                </span>
              </div>
            </div>
            <div className="request-row-actions">
              <button type="button" className={`btn btn-sm ${m.is_handled ? 'btn-outline' : 'btn-primary'}`}
                disabled={busyId === m.id}
                onClick={() => toggleHandled(m)}>
                {busyId === m.id ? 'Please wait…' : m.is_handled ? 'Reopen' : 'Mark handled'}
              </button>
              {m.email && (
                <a className="btn btn-outline btn-sm" href={`mailto:${m.email}`}>Reply by email</a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
