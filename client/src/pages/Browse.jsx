import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/api.js'

function ProfileCard({ p, assigned = false }) {
  return (
    <Link to={`/browse/${p.profileId}`} className="browse-card">
      <div className="browse-card-photo-wrap">
        {p.profilePhotoUrl ? (
          <img className="browse-card-photo" src={p.profilePhotoUrl} alt="" loading="lazy" />
        ) : (
          <div className="browse-card-photo" style={{ textAlign: 'center', paddingTop: 90, fontWeight: 800, color: 'var(--primary-deep)', fontSize: 30 }}>
            {(p.name || '?').slice(0, 1)}
          </div>
        )}
        {assigned && <span className="assigned-match-chip">Assigned match</span>}
      </div>
      <div className="browse-card-body">
        <div className="browse-card-name">{p.name}</div>
        <div className="browse-card-meta">
          {p.age ? `${p.age} yrs` : ''}{p.heightCm ? ` • ${p.heightCm} cm` : ''}
          {p.city ? ` • ${p.city}` : ''}
        </div>
        <div className="browse-card-tags">
          {p.education && <span className="browse-tag">{p.education}</span>}
          {p.occupation && <span className="browse-tag">{p.occupation}</span>}
          {p.nakshatra && <span className="browse-tag">{p.nakshatra}</span>}
          {p.gotra && <span className="browse-tag">{p.gotra}</span>}
        </div>
      </div>
    </Link>
  )
}

export default function Browse() {
  const [assignedMatch, setAssignedMatch] = useState(null)
  const [hasAssignment, setHasAssignment] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api('/browse')
      setAssignedMatch(data.data.assignedMatch ?? null)
      setHasAssignment(data.data.hasAssignment ?? Boolean(data.data.assignedMatch))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="browse-page">
      <h1 className="dashboard-title" style={{ marginBottom: 14 }}>
        Assigned matches
      </h1>

      {error && <p className="form-error">{error}</p>}
      {loading && <div className="page-loading">Loading your assigned match…</div>}

      {!loading && !error && !hasAssignment && (
        <div className="notifications-empty">
          The admin has not assigned any profiles to you yet.
        </div>
      )}

      {!loading && !error && hasAssignment && !assignedMatch && (
        <div className="notifications-empty">
          Your assigned profile is temporarily unavailable. Please contact the admin.
        </div>
      )}

      {!loading && !error && assignedMatch && (
        <div className="browse-grid">
          <ProfileCard p={assignedMatch} assigned />
        </div>
      )}
    </div>
  )
}
