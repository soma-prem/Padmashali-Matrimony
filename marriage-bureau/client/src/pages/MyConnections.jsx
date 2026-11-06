import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/api.js'

function fmtDate(v) {
  if (!v) return '—'
  return new Date(v).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function contactRow(all, key, label) {
  return (
    <div>
      <span className="k">{label}</span>
      <span className="v">{all?.[key] || '—'}</span>
    </div>
  )
}

export default function MyConnections() {
  const [items, setItems] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await api('/connections')
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

  const copy = async (value) => {
    if (value) await navigator.clipboard?.writeText(value).catch(() => {})
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-card wide">
        <h1 className="dashboard-title">My Connections</h1>
        <p className="page-description">
          People approved by the admin as your matches. Contact details are visible
          below — only on this page and your approved matches' own view.
        </p>
        <div className="page-return-link">
          <Link to="/browse" className="btn btn-outline btn-sm">← Browse profiles</Link>
        </div>

        {loading && <div className="page-loading">Loading connections…</div>}
        {error && <p className="form-error">{error}</p>}

        {!loading && !error && (items || []).length === 0 && (
          <div className="notif-empty">
            <p><strong>No connections yet.</strong></p>
            <p>Send an interest request from Browse Profiles — once the admin approves it,
              the match shows up here with contact details.</p>
          </div>
        )}

        <div className="conn-grid">
          {(items || []).map((item) => {
            const { profile, connectedAt, profileId } = item
            const basic = profile.basic ?? {}
            const lifestyle = profile.lifestyleLocation ?? {}
            const edu = profile.educationCareer ?? {}
            const photo = (profile.photos || []).find((p) => p.isMain) ?? profile.photos?.[0]
            return (
              <div className="conn-card" key={profile.userId}>
                <div className="conn-top">
                  {photo?.url ? (
                    <img className="detail-avatar" src={photo.url} alt=""
                      style={{ width: 64, height: 80 }} />
                  ) : (
                    <div className="detail-avatar" style={{ display: 'grid', placeItems: 'center', width: 64, height: 80, fontWeight: 800, color: 'var(--primary-deep)' }}>
                      {(basic.name || '?').slice(0, 1)}
                    </div>
                  )}
                  <div>
                    <div className="browse-card-name" style={{ fontSize: 17 }}>{basic.name}</div>
                    <div className="browse-card-meta">
                      {basic.gender === 'male' ? 'Male' : 'Female'}
                      {basic.heightCm ? ` • ${basic.heightCm} cm` : ''}
                      {lifestyle.city ? ` • ${lifestyle.city}` : ''}
                    </div>
                    <div className="browse-card-meta">
                      {edu.occupation || edu.highestQualification || ''}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Connected: {fmtDate(connectedAt)}</div>
                  </div>
                </div>

                <div className="admin-contact-box" style={{ marginTop: 0 }}>
                  <h4>Contact details</h4>
                  <div className="conn-contact-list">
                    {contactRow(profile.contact, 'mobile', 'Mobile')}
                    {contactRow(profile.contact, 'whatsapp', 'WhatsApp')}
                    {contactRow(profile.contact, 'email', 'Email')}
                    {contactRow(profile.contact, 'address', 'Address')}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-outline btn-sm"
                    onClick={() => copy(profile.contact?.mobile)}>
                    Copy mobile
                  </button>
                  {profileId && (
                    <Link to={`/browse/${profileId}`} className="btn btn-outline btn-sm">
                      Full profile
                    </Link>
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
