import { useEffect, useState } from 'react'
import { api } from '../../api/api.js'
import AdminPagination from '../../components/admin/AdminPagination.jsx'
import PhotoPreview from '../../components/admin/PhotoPreview.jsx'

function initials(name = '') {
  return name.trim().slice(0, 1).toUpperCase() || '?'
}

function statusChip(status) {
  return <span className={`status-chip status-chip--${status}`}>{status.replace('_', ' ')}</span>
}

function canAssign(profile) {
  return profile.status === 'approved' &&
    profile.paymentStatus === 'verified' &&
    !profile.paymentRequired &&
    profile.isActive
}

function ProfileAvatar({ profile }) {
  return profile.profilePhotoUrl
    ? <PhotoPreview className="admin-avatar" src={profile.profilePhotoUrl} alt={`${profile.name} profile photo`} />
    : <div className="admin-avatar">{initials(profile.name)}</div>
}

export default function AdminAssignmentsPage() {
  const [profiles, setProfiles] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedProfile, setSelectedProfile] = useState(null)
  const [candidateSearchInput, setCandidateSearchInput] = useState('')
  const [candidateSearch, setCandidateSearch] = useState('')
  const [candidates, setCandidates] = useState([])
  const [candidatePage, setCandidatePage] = useState(1)
  const [candidateTotalPages, setCandidateTotalPages] = useState(1)
  const [candidateLoading, setCandidateLoading] = useState(false)
  const [candidateError, setCandidateError] = useState('')
  const [assignedProfile, setAssignedProfile] = useState(null)
  const [chosenCandidate, setChosenCandidate] = useState(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      setSearch(searchInput.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const qs = new URLSearchParams({ page: String(page) })
        if (search) qs.set('search', search)
        const response = await api(`/admin/profiles?${qs.toString()}`)
        if (!cancelled) {
          setProfiles(response.data.items)
          setTotalPages(response.data.totalPages)
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [page, search])

  useEffect(() => {
    const timer = setTimeout(() => {
      setCandidatePage(1)
      setCandidateSearch(candidateSearchInput.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [candidateSearchInput])

  useEffect(() => {
    if (!selectedProfile) return undefined

    let cancelled = false
    const load = async () => {
      setCandidateLoading(true)
      setCandidateError('')
      setChosenCandidate(null)
      try {
        const gender = selectedProfile.gender === 'female' ? 'male' : 'female'
        const qs = new URLSearchParams({ page: String(candidatePage), gender, eligible: 'true' })
        if (candidateSearch) qs.set('search', candidateSearch)
        const [profileResponse, assignmentResponse] = await Promise.all([
          api(`/admin/profiles?${qs.toString()}`),
          api(`/admin/assignments/${selectedProfile.userId}`),
        ])
        if (!cancelled) {
          setCandidates(profileResponse.data.items)
          setCandidateTotalPages(profileResponse.data.totalPages)
          setAssignedProfile(assignmentResponse.data.assignedProfile)
        }
      } catch (err) {
        if (!cancelled) setCandidateError(err.message)
      } finally {
        if (!cancelled) setCandidateLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [selectedProfile, candidatePage, candidateSearch])

  const openAssignment = (profile) => {
    setSelectedProfile(profile)
    setCandidates([])
    setCandidateSearchInput('')
    setCandidateSearch('')
    setCandidatePage(1)
    setAssignedProfile(null)
    setChosenCandidate(null)
    setNotice('')
  }

  const closeAssignment = () => {
    if (saving) return
    setSelectedProfile(null)
    setCandidates([])
    setCandidateError('')
  }

  const confirmAssignment = async () => {
    if (!selectedProfile || !chosenCandidate) return
    const brideUserId = selectedProfile.gender === 'female'
      ? selectedProfile.userId
      : chosenCandidate.userId
    const groomUserId = selectedProfile.gender === 'male'
      ? selectedProfile.userId
      : chosenCandidate.userId

    setSaving(true)
    setCandidateError('')
    try {
      await api('/admin/assignments', {
        method: 'POST',
        body: { brideUserId, groomUserId },
      })
      setAssignedProfile(chosenCandidate)
      setChosenCandidate(null)
      setNotice('Assignment saved. The assigned profile will appear in both users’ Assigned matches.')
    } catch (err) {
      setCandidateError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 className="dashboard-title" style={{ marginBottom: 8 }}>Assign users</h1>
      <p className="page-description">Choose a profile, then assign one profile of the opposite gender. Each user can have one assigned match; assigning again replaces any existing pair for either selected profile.</p>

      <div className="admin-filters">
        <input
          className="form-input search"
          placeholder="Search name or email…"
          aria-label="Search profiles by name or email"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading && <div className="page-loading">Loading profiles…</div>}
      {!loading && !error && profiles.length === 0 && (
        <div className="notifications-empty">No profiles match your search.</div>
      )}

      <div className="admin-list">
        {!loading && !error && profiles.map((profile) => (
          <article className="admin-list-item" key={profile.userId}>
            <ProfileAvatar profile={profile} />
            <div className="admin-item-main">
              <div className="admin-item-name">{profile.name}</div>
              <div className="admin-item-mail">{profile.accountEmail}</div>
              <div className="admin-item-meta">
                {statusChip(profile.status)}
                {profile.gender && <span>{profile.gender === 'male' ? '♂ Groom' : '♀ Bride'}</span>}
                <span>Payment: {profile.paymentStatus || 'not verified'}</span>
                {profile.age && <span>{profile.age} yrs</span>}
                {profile.city && <span>{profile.city}</span>}
              </div>
            </div>
            <div className="admin-item-actions">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={!profile.gender || !canAssign(profile)}
                onClick={() => openAssignment(profile)}
              >
                Assign
              </button>
              {!canAssign(profile) && (
                <small className="admin-item-mail">Requires an active, approved profile with verified payment.</small>
              )}
            </div>
          </article>
        ))}
      </div>

      {!loading && !error && profiles.length > 0 && (
        <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      {selectedProfile && (
        <div className="admin-confirm-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeAssignment()
        }}>
          <section className="admin-confirm-dialog admin-assignment-dialog" role="dialog" aria-modal="true" aria-labelledby="assignment-title">
            <h2 id="assignment-title">Assign a {selectedProfile.gender === 'female' ? 'groom' : 'bride'} profile</h2>
            <p>
              Selected profile: <strong>{selectedProfile.name}</strong>
              {assignedProfile && <> · Currently assigned to <strong>{assignedProfile.name}</strong></>}
            </p>

            {notice && <p className="assignment-notice" role="status">{notice}</p>}

            <label className="admin-assignment-search">
              <span>Search {selectedProfile.gender === 'female' ? 'groom' : 'bride'} profiles</span>
              <input
                className="form-input"
                placeholder="Search name or email…"
                value={candidateSearchInput}
                onChange={(event) => setCandidateSearchInput(event.target.value)}
              />
            </label>

            {candidateError && <p className="form-error">{candidateError}</p>}
            {candidateLoading && <div className="page-loading">Loading matching profiles…</div>}
            {!candidateLoading && !candidateError && candidates.length === 0 && (
              <div className="notifications-empty">No eligible approved and paid profiles of the opposite gender match your search.</div>
            )}

            <div className="admin-assignment-candidates">
              {!candidateLoading && !candidateError && candidates.map((candidate) => {
                const isSelected = chosenCandidate?.userId === candidate.userId
                const isCurrent = assignedProfile?.userId === candidate.userId
                return (
                  <button
                    type="button"
                    className={`admin-assignment-candidate${isSelected ? ' is-selected' : ''}`}
                    key={candidate.userId}
                    aria-pressed={isSelected}
                    onClick={() => { setChosenCandidate(candidate); setNotice('') }}
                  >
                    <ProfileAvatar profile={candidate} />
                    <span className="admin-assignment-candidate-main">
                      <strong>{candidate.name}</strong>
                      <span>{candidate.accountEmail}</span>
                      <span>{candidate.age ? `${candidate.age} yrs · ` : ''}{candidate.city || 'Location not set'}</span>
                    </span>
                    <span className="admin-assignment-candidate-status">
                      {isCurrent ? 'Currently assigned' : statusChip(candidate.status)}
                    </span>
                  </button>
                )
              })}
            </div>

            {!candidateLoading && !candidateError && candidates.length > 0 && (
              <AdminPagination
                page={candidatePage}
                totalPages={candidateTotalPages}
                onPageChange={setCandidatePage}
              />
            )}

            <div className="admin-confirm-actions">
              <button type="button" className="btn btn-outline" disabled={saving} onClick={closeAssignment}>Close</button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!chosenCandidate || saving || chosenCandidate.userId === assignedProfile?.userId}
                onClick={confirmAssignment}
              >
                {saving ? 'Saving…' : 'Confirm assignment'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
