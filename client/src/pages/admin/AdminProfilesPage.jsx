import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../api/api.js'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import PhotoPreview from '../../components/admin/PhotoPreview.jsx'
import AdminPagination from '../../components/admin/AdminPagination.jsx'

const PROFILE_SECTIONS = [
  { status: 'pending_approval', title: 'Pending profiles' },
  { status: 'approved', title: 'Completed profiles' },
  { status: 'rejected', title: 'Rejected profiles' },
  { status: 'draft', title: 'Draft profiles' },
]

const PROFILE_VIEWS = [
  { value: 'workflow', label: 'Pending & completed' },
  { value: 'rejected', label: 'Rejected profiles' },
  { value: 'draft', label: 'Draft profiles' },
]

const GENDER_OPTIONS = [
  { value: '', label: 'All genders' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

function initials(name = '') {
  return name.trim().slice(0, 1).toUpperCase() || '?'
}

function fmtDate(v) {
  if (!v) return '—'
  return new Date(v).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function statusChip(status) {
  return <span className={`status-chip status-chip--${status}`}>{status.replace('_', ' ')}</span>
}

export default function AdminProfilesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const gender = searchParams.get('gender') ?? ''
  const search = searchParams.get('search') ?? ''

  const [sections, setSections] = useState({})
  const [sectionPages, setSectionPages] = useState({})
  const [profileView, setProfileView] = useState('workflow')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchInput, setSearchInput] = useState(search)
  const [busyId, setBusyId] = useState(null)
  const [confirmation, setConfirmation] = useState(null)

  // debounce search box -> URL (350ms)
  useEffect(() => {
    const id = setTimeout(() => {
      const current = new URLSearchParams(searchParams)
      if (searchInput === search) return
      if (searchInput) current.set('search', searchInput)
      else {
        current.delete('search')
      }
      setSectionPages({})
      setSearchParams(current)
    }, 350)
    return () => clearTimeout(id)
  }, [searchInput]) // eslint-disable-line react-hooks/exhaustive-deps

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const results = await Promise.all(PROFILE_SECTIONS.map(async (section) => {
        const qs = new URLSearchParams({
          page: String(sectionPages[section.status] || 1),
          status: section.status,
        })
        if (gender) qs.set('gender', gender)
        if (search) qs.set('search', search)
        const response = await api(`/admin/profiles?${qs.toString()}`)
        return [section.status, response.data]
      }))
      setSections(Object.fromEntries(results))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [gender, search, sectionPages]) // eslint-disable-line react-hooks/exhaustive-deps

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSectionPages({})
    setSearchParams(next)
  }

  const setSectionPage = (status, page) => {
    setSectionPages((current) => ({ ...current, [status]: page }))
  }

  const toggleActive = async (item) => {
    const target = !item.isActive
    setConfirmation(null)
    setBusyId(item.userId)
    setError('')
    try {
      await api(`/admin/users/${item.userId}/active`, { method: 'PATCH', body: { isActive: target } })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const confirmToggleActive = (item) => {
    const target = !item.isActive
    setConfirmation({
      title: target ? 'Activate account?' : 'Deactivate account?',
      message: target
        ? `Activate ${item.accountEmail}?`
        : `Deactivate ${item.accountEmail}? They will no longer be able to log in.`,
      confirmLabel: target ? 'Activate' : 'Deactivate',
      danger: !target,
      action: () => toggleActive(item),
    })
  }

  const visibleSections = profileView === 'workflow'
    ? PROFILE_SECTIONS.slice(0, 2)
    : PROFILE_SECTIONS.filter((section) => section.status === profileView)

  return (
    <div>
      <h1 className="dashboard-title" style={{ marginBottom: 16 }}>Profiles &amp; Users</h1>

      <div className="admin-filters">
        <input
          className="form-input search"
          placeholder="Search name or email…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select className="form-input" value={gender} onChange={(e) => setFilter('gender', e.target.value)}>
          {GENDER_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
        </select>
        <select className="form-input" value={profileView} onChange={(e) => setProfileView(e.target.value)}>
          {PROFILE_VIEWS.map((view) => (
            <option key={view.value} value={view.value}>{view.label}</option>
          ))}
        </select>
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading && <div className="page-loading">Loading profiles…</div>}

      {!loading && !error && visibleSections.map((section) => {
        const data = sections[section.status]
        const items = data?.items || []
        const page = data?.page || 1
        const totalPages = data?.totalPages || 1

        return (
          <section className="admin-profile-section" key={section.status}>
            <h2>{section.title}{data ? ` (${data.total})` : ''}</h2>
            {items.length === 0 ? (
              <div className="notifications-empty">No {section.title.toLowerCase()} match these filters.</div>
            ) : (
              <>
                <div className="admin-profile-grid">
                  {items.map((item) => (
                    <article className="admin-list-item admin-profile-card" key={item.userId}>
                      {item.profilePhotoUrl
                        ? <PhotoPreview className="admin-avatar" src={item.profilePhotoUrl} alt={`${item.name} profile photo`} />
                        : <div className="admin-avatar">{initials(item.name)}</div>}

                      <div className="admin-item-main">
                        <div className="admin-item-name">
                          {item.name} {item.isActive === false && <span className="inactive-tag">Deactivated</span>}
                        </div>
                        <div className="admin-item-mail">{item.accountEmail}</div>
                        <div className="admin-item-meta">
                          {statusChip(item.status)}
                          {(item.gender || item.age) && (
                            <span>{item.gender && (item.gender === 'male' ? '♂ Male' : '♀ Female')}{item.age ? ` · ${item.age} yrs` : ''}</span>
                          )}
                          {item.city && <span>{item.city}</span>}
                          <span>{item.completionPercent}% complete</span>
                          <span>Submitted: {fmtDate(item.submittedAt)}</span>
                          <span>Registered: {fmtDate(item.registeredAt)}</span>
                        </div>
                      </div>

                      <div className="admin-item-actions">
                        <button type="button" className="btn btn-outline btn-sm"
                          onClick={() => navigate(`/admin/profiles/${item.userId}`)}>
                          View
                        </button>
                        <button type="button" className={`btn btn-sm ${item.isActive ? 'btn-danger' : 'btn-primary'}`}
                          disabled={busyId === item.userId}
                          onClick={() => confirmToggleActive(item)}>
                          {busyId === item.userId ? 'Please wait…' : item.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <AdminPagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={(nextPage) => setSectionPage(section.status, nextPage)}
                />
              </>
            )}
          </section>
        )
      })}
      <ConfirmDialog
        open={!!confirmation}
        title={confirmation?.title}
        message={confirmation?.message}
        confirmLabel={confirmation?.confirmLabel}
        danger={confirmation?.danger}
        busy={busyId !== null}
        onCancel={() => setConfirmation(null)}
        onConfirm={() => confirmation?.action()}
      />
    </div>
  )
}
