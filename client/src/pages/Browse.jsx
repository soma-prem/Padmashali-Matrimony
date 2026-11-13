import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/api.js'
import { useLanguage } from '../context/LanguageContext.jsx'

function ProfileCard({ p, assigned = false }) {
  const { t } = useLanguage()
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
        {assigned && <span className="assigned-match-chip">{t('Assigned match')}</span>}
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
  const { t } = useLanguage()
  const [assignedMatches, setAssignedMatches] = useState([])
  const [hasAssignment, setHasAssignment] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api('/browse')
      const matches = data.data.assignedMatches ?? data.data.items ?? (
        data.data.assignedMatch ? [data.data.assignedMatch] : []
      )
      setAssignedMatches(matches)
      setHasAssignment(data.data.hasAssignment ?? matches.length > 0)
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
        {t('Assigned matches')}
      </h1>

      {error && <p className="form-error">{error}</p>}
      {loading && <div className="page-loading">{t('Loading your assigned profiles…')}</div>}

      {!loading && !error && !hasAssignment && (
        <div className="notifications-empty">
          {t('The admin has not assigned any profiles to you yet.')}
        </div>
      )}

      {!loading && !error && hasAssignment && assignedMatches.length === 0 && (
        <div className="notifications-empty">
          {t('Your assigned profiles are temporarily unavailable. Please contact the admin.')}
        </div>
      )}

      {!loading && !error && assignedMatches.length > 0 && (
        <div className="browse-grid">
          {assignedMatches.map((profile) => <ProfileCard key={profile.profileId} p={profile} assigned />)}
        </div>
      )}
    </div>
  )
}
