import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../api/api.js'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import PhotoPreview from '../../components/admin/PhotoPreview.jsx'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending_approval', label: 'Pending approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'draft', label: 'Draft' },
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

  const status = searchParams.get('status') ?? ''
  const gender = searchParams.get('gender') ?? ''
  const search = searchParams.get('search') ?? ''
  const page = Number.parseInt(searchParams.get('page'), 10) || 1

  const [items, setItems] = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [pageInfo, setPageInfo] = useState(1)
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
        current.delete('page')
      }
      setSearchParams(current)
    }, 350)
    return () => clearTimeout(id)
  }, [searchInput]) // eslint-disable-line react-hooks/exhaustive-deps

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const qs = new URLSearchParams({ page: String(page) })
      if (status) qs.set('status', status)
      if (gender) qs.set('gender', gender)
      if (search) qs.set('search', search)
      const data = await api(`/admin/profiles?${qs.toString()}`)
      setItems(data.data.items)
      setTotalPages(data.data.totalPages)
      setTotal(data.data.total)
      setPageInfo(data.data.page)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [status, gender, search, page]) // eslint-disable-line react-hooks/exhaustive-deps

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  const setPage = (key, value) => {
    const next = new URLSearchParams(searchParams)
    next.set(key, value)
    setSearchParams(next)
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
        <select className="form-input" value={status} onChange={(e) => setFilter('status', e.target.value)}>
          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select className="form-input" value={gender} onChange={(e) => setFilter('gender', e.target.value)}>
          {GENDER_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
        </select>
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading && <div className="page-loading">Loading profiles…</div>}

      {!loading && !error && items.length === 0 && (
        <div className="notifications-empty">No profiles match these filters.</div>
      )}

      <div className="admin-list">
        {items.map((item) => (
          <div className="admin-list-item" key={item.userId}>
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
                <span>{item.gender && (item.gender === 'male' ? '♂ Male' : '♀ Female')}</span>
                <span>{item.age ? `${item.age} yrs` : ''}</span>
                <span>{item.city || '—'}</span>
                <span>{item.completionPercent}% complete</span>
                <span>Submitted: {fmtDate(item.submittedAt)}</span>
                <span>Registered: {fmtDate(item.registeredAt)}</span>
              </div>
            </div>

            <div className="admin-item-actions">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => navigate(`/admin/profiles/${item.userId}`)}
              >
                View
              </button>
              <button
                type="button"
                className={`btn btn-sm ${item.isActive ? 'btn-danger' : 'btn-primary'}`}
                disabled={busyId === item.userId}
                onClick={() => confirmToggleActive(item)}
              >
                {busyId === item.userId ? 'Please wait…' : item.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={pageInfo <= 1}
            onClick={() => setPage('page', String(pageInfo - 1))}
          >
            ← Prev
          </button>
          <span>Page {pageInfo} of {totalPages}</span>
          <button type="button" className="btn btn-outline btn-sm" disabled={pageInfo >= totalPages}
            onClick={() => { const n = new URLSearchParams(searchParams); n.set('page', String(pageInfo + 1)); setSearchParams(n) }}>
            Next →
          </button>
        </div>
      )}
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
