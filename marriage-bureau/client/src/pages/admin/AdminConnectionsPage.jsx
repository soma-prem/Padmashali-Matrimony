import { useEffect, useState } from 'react'
import { api } from '../../api/api.js'
import PhotoPreview from '../../components/admin/PhotoPreview.jsx'

function fmtDate(v) {
  if (!v) return '—'
  return new Date(v).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function Party({ party }) {
  if (!party) return <span style={{ fontSize: 13 }}>Profile missing</span>
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      {party.profilePhotoUrl ? (
        <PhotoPreview className="admin-avatar" src={party.profilePhotoUrl} alt={`${party.name} profile photo`}
          style={{ width: 40, height: 40 }} />
      ) : (
        <div className="admin-avatar" style={{ width: 40, height: 40 }}>
          {(party.name || '?').slice(0, 1)}
        </div>
      )}
      <span style={{ minWidth: 0 }}>
        <span className="admin-item-name" style={{ display: 'block' }}>{party.name}</span>
        <span className="admin-item-mail" style={{ display: 'block' }}>
          {party.gender === 'male' ? '♂' : '♀'} {party.age ? `${party.age} yrs` : ''} {party.city || ''}
        </span>
      </span>
    </span>
  )
}

export default function AdminConnectionsPage() {
  const [items, setItems] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await api('/admin/connections')
        if (!cancelled) setItems(data.data.items)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div>
      <h1 className="dashboard-title" style={{ marginBottom: 14 }}>Connections</h1>

      {loading && <div className="page-loading">Loading connections…</div>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && (items || []).length === 0 && (
        <div className="notifications-empty">
          No connections yet — approve interest requests on the Requests tab.
        </div>
      )}

      <div className="admin-list">
        {(items || []).map((c) => (
          <div className="request-row" key={c.id} style={{ flexWrap: 'wrap' }}>
            <div className="request-row-main">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <Party party={c.userA} />
                <span style={{ fontSize: 16, color: 'var(--primary)', fontWeight: 800 }}>↔</span>
                <Party party={c.userB} />
              </div>
              <div className="admin-item-meta" style={{ marginTop: 6 }}>
                <span>Connected: {fmtDate(c.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
