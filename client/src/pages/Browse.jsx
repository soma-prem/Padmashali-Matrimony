import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/api.js'
import { NAKSHATRA_OPTIONS, PREF_MARITAL_OPTIONS } from '../utils/profileOptions.js'

// profiles can only be never_married/divorced/widowed/separated (no "any")
const MARITAL_FILTERS = PREF_MARITAL_OPTIONS.filter((o) => o.value !== 'any')

const RELATION_LABELS = {
  request_pending: { text: '⏳ Request pending', cls: 'status-chip status-chip--pending_approval' },
  connected: { text: 'Connected ✓', cls: 'status-chip status-chip--approved' },
  request_rejected: { text: 'Request rejected', cls: 'status-chip status-chip--rejected' },
}

function ProfileCard({ p }) {
  const rel = RELATION_LABELS[p.relationship]
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
        {rel && <span className={rel.cls}>{rel.text}</span>}
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

const EMPTY_FILTERS = {
  minAge: '', maxAge: '', education: '', city: '', state: '',
  nakshatra: '', gotra: '', maritalStatus: '',
}

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = {
    minAge: searchParams.get('minAge') ?? '',
    maxAge: searchParams.get('maxAge') ?? '',
    education: searchParams.get('education') ?? '',
    city: searchParams.get('city') ?? '',
    state: searchParams.get('state') ?? '',
    nakshatra: searchParams.get('nakshatra') ?? '',
    gotra: searchParams.get('gotra') ?? '',
    maritalStatus: searchParams.get('maritalStatus') ?? '',
  }
  const page = Math.max(1, Number.parseInt(searchParams.get('page'), 10) || 1)

  const [items, setItems] = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [pageInfo, setPageInfo] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const qs = new URLSearchParams({ page: String(page) })
      for (const [k, v] of Object.entries(filters)) if (v) qs.set(k, v)
      const data = await api(`/browse?${qs.toString()}`)
      setItems(data.data.items)
      setTotalPages(data.data.totalPages)
      setPageInfo(data.data.page)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  const applyFilters = (e) => {
    e.preventDefault()
    const next = new URLSearchParams()
    const form = new FormData(e.target)
    for (const key of Object.keys(EMPTY_FILTERS)) {
      const v = String(form.get(key) || '').trim()
      if (v) next.set(key, v)
    }
    setSearchParams(next)
  }

  const setPage = (n) => {
    const next = new URLSearchParams(searchParams)
    if (n > 1) next.set('page', String(n))
    else next.delete('page')
    setSearchParams(next)
  }

  return (
    <div className="browse-page">
      <h1 className="dashboard-title" style={{ marginBottom: 14 }}>
        Browse Profiles
      </h1>

      <form className="browse-filters" onSubmit={applyFilters}>
        <div className="field">
          <label htmlFor="f-minage">Min age</label>
          <input id="f-minage" name="minAge" type="number" min={18} max={100} className="form-input" defaultValue={filters.minAge} />
        </div>
        <div className="field">
          <label htmlFor="f-maxage">Max age</label>
          <input id="f-maxage" name="maxAge" type="number" min={18} max={100} className="form-input" defaultValue={filters.maxAge} />
        </div>
        <div className="field">
          <label htmlFor="f-edu">Education</label>
          <input id="f-edu" name="education" className="form-input" placeholder="e.g. B.Tech" defaultValue={filters.education} />
        </div>
        <div className="field">
          <label htmlFor="f-marital">Marital status</label>
          <select id="f-marital" name="maritalStatus" className="form-input" defaultValue={filters.maritalStatus}>
            <option value="">Any</option>
            {MARITAL_FILTERS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-city">City</label>
          <input id="f-city" name="city" className="form-input" defaultValue={filters.city} />
        </div>
        <div className="field">
          <label htmlFor="f-state">State</label>
          <input id="f-state" name="state" className="form-input" defaultValue={filters.state} />
        </div>
        <div className="field">
          <label htmlFor="f-nakshatra">Nakshatra</label>
          <select id="f-nakshatra" name="nakshatra" className="form-input" defaultValue={filters.nakshatra}>
            <option value="">Any</option>
            {NAKSHATRA_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-gotra">Gotra</label>
          <input id="f-gotra" name="gotra" className="form-input" defaultValue={filters.gotra} />
        </div>
        <div className="browse-filters-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>Apply filters</button>
          <button type="button" className="btn btn-outline" onClick={() => { setSearchParams({}) }}>Clear</button>
        </div>
      </form>

      {error && <p className="form-error">{error}</p>}
      {loading && <div className="page-loading">Loading profiles…</div>}

      {!loading && !error && items.length === 0 && (
        <div className="notifications-empty">
          No profiles match your filters yet. Try clearing some filters.
        </div>
      )}

      <div className="browse-grid">
        {items.map((p) => <ProfileCard key={p.profileId} p={p} />)}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button type="button" className="btn btn-outline btn-sm" disabled={pageInfo <= 1} onClick={() => setPage(pageInfo - 1)}>
            ← Prev
          </button>
          <span>Page {pageInfo} of {totalPages}</span>
          <button type="button" className="btn btn-outline btn-sm" disabled={pageInfo >= totalPages} onClick={() => setPage(pageInfo + 1)}>
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
