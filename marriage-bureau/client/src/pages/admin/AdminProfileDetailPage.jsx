import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/api.js'

function ReviewGroup({ title, children }) {
  return (
    <div className="review-group">
      <h4>{title}</h4>
      <div className="review-list">{children}</div>
    </div>
  )
}

function Row({ k, v }) {
  const text = v === null || v === undefined || v === '' ? '—'
    : typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)
  return <div><span className="k">{k}</span><span className="v">{text}</span></div>
}

function fmtDate(v) {
  if (!v) return '—'
  return new Date(v).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export default function AdminProfileDetailPage() {
  const { userId } = useParams()
  const navigate = useNavigate()

  const [payload, setPayload] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [message, setMessage] = useState('')
  const [showRejectBox, setShowRejectBox] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api(`/admin/profiles/${userId}`)
      setPayload(data.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const doApprove = async () => {
    if (!window.confirm('Approve this profile? The user will be notified and can browse profiles.')) return
    setBusy(true); setActionError(''); setMessage('')
    try {
      const data = await api(`/admin/profiles/${userId}/approve`, { method: 'POST' })
      setMessage(data.message || 'Profile approved.')
      await load()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const doReject = async () => {
    if (reason.trim().length < 5) {
      setActionError('Give a reason of at least 5 characters.')
      return
    }
    if (!window.confirm('Reject this profile? The user will see your reason.')) return
    setBusy(true); setActionError(''); setMessage('')
    try {
      const data = await api(`/admin/profiles/${userId}/reject`, {
        method: 'POST',
        body: { reason: reason.trim() },
      })
      setMessage(data.message || 'Profile rejected.')
      setReason('')
      setShowRejectBox(false)
      await load()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="page-loading">Loading profile…</div>
  if (error) {
    return (
      <div className="dashboard-card">
        <p className="form-error">{error}</p>
        <Link to="/admin/profiles" className="btn btn-outline">← Back to list</Link>
      </div>
    )
  }

  const { profile, account } = payload
  const canApprove = profile.status === 'pending_approval'
  const photos = profile.photos || []

  return (
    <div>
      <div className="admin-detail-top">
        <div>
          <h1 className="dashboard-title" style={{ marginBottom: 4 }}>{profile.basic?.name || 'Profile'}</h1>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className={`status-chip status-chip--${profile.status}`}>
              {profile.status.replace('_', ' ')}
            </span>
            <span style={{ fontSize: 13 }}>{profile.completionPercent}% complete</span>
          </div>
        </div>
        <Link to="/admin/profiles" className="btn btn-outline btn-sm">← Back to list</Link>
      </div>

      {/* account box */}
      <div className="dashboard-card admin-account-card" style={{ padding: '16px 18px', marginBottom: 14 }}>
        <div className="review-list">
          <Row k="Account name" v={account.name} />
          <Row k="Email" v={account.email} />
          <Row k="Role" v={account.role} />
          <Row k="Active" v={account.isActive} />
          <Row k="Registered" v={fmtDate(account.createdAt)} />
          <Row k="Profile last updated" v={fmtDate(profile.updatedAt)} />
        </div>
        {profile.status === 'rejected' && profile.rejectionReason && (
          <p style={{ marginTop: 10, color: 'var(--error)', fontWeight: 600 }}>
            Rejection reason: {profile.rejectionReason}
          </p>
        )}
      </div>

      <div className="wizard-card" style={{ marginBottom: 14 }}>
        {message && <div className="profile-banner profile-banner--success" role="status">✔ {message}</div>}
        {actionError && <div className="profile-banner profile-banner--error" role="alert">{actionError}</div>}

        {/* photos */}
        <ReviewGroup title="Photos">
          {photos.length > 0 ? (
            <div className="admin-photo-strip">
              {photos.map((p) => <img key={p.id} src={p.url} alt="Profile photo" />)}
            </div>
          ) : <Row k="Photos" v="No photos uploaded" />}
        </ReviewGroup>

        {/* contact details */}
        <div className="admin-contact-box">
          <h4>Contact details (private — admin & approved connects only)</h4>
          <div className="review-list">
            <Row k="Mobile" v={profile.contact?.mobile} />
            <Row k="WhatsApp" v={profile.contact?.whatsapp} />
            <Row k="Email" v={profile.contact?.email} />
            <Row k="Address" v={profile.contact?.address} />
          </div>
        </div>
      </div>

      {/* full sections */}
      <div className="review-grid">
        <ReviewGroup title="Basic">
          <Row k="Name" v={profile.basic?.name} />
          <Row k="Gender" v={profile.basic?.gender} />
          <Row k="Date of birth" v={profile.basic?.dateOfBirth} />
          <Row k="Height" v={profile.basic?.heightCm && `${profile.basic.heightCm} cm`} />
          <Row k="Weight" v={profile.basic?.weightKg && `${profile.basic.weightKg} kg`} />
          <Row k="Marital status" v={profile.basic?.maritalStatus} />
          <Row k="Mother tongue" v={profile.basic?.motherTongue} />
          <Row k="About me" v={profile.basic?.aboutMe} />
        </ReviewGroup>

        <ReviewGroup title="Community">
          <Row k="Caste" v={profile.community?.caste} />
          <Row k="Sub-caste / Kulam" v={profile.community?.subCasteKulam} />
          <Row k="Gotra" v={profile.community?.gotra} />
        </ReviewGroup>

        <ReviewGroup title="Horoscope">
          <Row k="Time of birth" v={profile.horoscope?.timeOfBirth} />
          <Row k="Place of birth" v={profile.horoscope?.placeOfBirth} />
          <Row k="Rashi" v={profile.horoscope?.rashi} />
          <Row k="Nakshatra" v={profile.horoscope?.nakshatra} />
          <Row k="Pada" v={profile.horoscope?.pada} />
          <Row k="Manglik" v={profile.horoscope?.manglik} />
          <Row k="Graha details" v={profile.horoscope?.grahaDetails} />
          {profile.horoscope?.kundliImageUrl && (
            <div style={{ marginTop: 8 }}>
              <span className="k">Kundli image</span>
              <img src={profile.horoscope.kundliImageUrl} alt="Kundli"
                style={{ maxWidth: '100%', maxHeight: 320, objectFit: 'contain', border: '1px solid var(--border)', borderRadius: 8, marginTop: 6 }} />
            </div>
          )}
        </ReviewGroup>

        <ReviewGroup title="Education &amp; Career">
          <Row k="Qualification" v={profile.educationCareer?.highestQualification} />
          <Row k="College" v={profile.educationCareer?.college} />
          <Row k="Field" v={profile.educationCareer?.fieldOfStudy} />
          <Row k="Occupation" v={profile.educationCareer?.occupation} />
          <Row k="Company" v={profile.educationCareer?.company} />
          <Row k="Annual income" v={profile.educationCareer?.annualIncome} />
        </ReviewGroup>

        <ReviewGroup title="Family">
          <Row k="Father" v={profile.family?.fatherName && `${profile.family.fatherName}${profile.family.fatherOccupation ? ` (${profile.family.fatherOccupation})` : ''}`} />
          <Row k="Mother" v={profile.family?.motherName && `${profile.family.motherName}${profile.family.motherOccupation ? ` (${profile.family.motherOccupation})` : ''}`} />
          <Row k="Brothers" v={profile.family?.brothers} />
          <Row k="Sisters" v={profile.family?.sisters} />
          <Row k="Family type" v={profile.family?.familyType} />
          <Row k="Family values" v={profile.family?.familyValues} />
          <Row k="Native place" v={profile.family?.nativePlace} />
        </ReviewGroup>

        <ReviewGroup title="Lifestyle &amp; Location">
          <Row k="Diet" v={profile.lifestyleLocation?.diet} />
          <Row k="Smoking" v={profile.lifestyleLocation?.smoking} />
          <Row k="Drinking" v={profile.lifestyleLocation?.drinking} />
          <Row k="Hobbies" v={profile.lifestyleLocation?.hobbies} />
          <Row k="City" v={profile.lifestyleLocation?.city} />
          <Row k="State" v={profile.lifestyleLocation?.state} />
          <Row k="Country" v={profile.lifestyleLocation?.country} />
          <Row k="Willing to relocate" v={profile.lifestyleLocation?.willingToRelocate} />
        </ReviewGroup>

        <ReviewGroup title="Partner Preferences">
          <Row k="Age range" v={profile.preferences?.minAge && `${profile.preferences.minAge} – ${profile.preferences.maxAge ?? '?'} yrs`} />
          <Row k="Height range" v={profile.preferences?.minHeightCm && `${profile.preferences.minHeightCm} – ${profile.preferences.maxHeightCm ?? '?'} cm`} />
          <Row k="Education" v={profile.preferences?.education} />
          <Row k="Location" v={profile.preferences?.location} />
          <Row k="Marital status" v={profile.preferences?.maritalStatus} />
        </ReviewGroup>
      </div>

      {/* actions */}
      <div className="wizard-card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" disabled={!canApprove || busy} onClick={doApprove}>
            {profile.status === 'approved' ? 'Already approved' : profile.status === 'draft' ? 'Not submitted yet' : 'Approve'}
          </button>
          <button type="button" className="btn btn-danger" disabled={profile.status !== 'pending_approval' || busy}
            onClick={() => setShowRejectBox(true)}>
            Reject with reason
          </button>
        </div>

        {showRejectBox && (
          <div className="reject-box">
            <label htmlFor="reject-reason" style={{ fontWeight: 700, fontSize: 14 }}>Reason (shown to the user)</label>
            <textarea id="reject-reason" className="form-input" rows={3} maxLength={500}
              placeholder="e.g. About me is missing — write at least 3 sentences about yourself."
              value={reason} onChange={(e) => setReason(e.target.value)} />
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button type="button" className="btn btn-danger btn-sm" disabled={busy} onClick={doReject}>
                {busy ? 'Please wait…' : 'Confirm rejection'}
              </button>
              <button type="button" className="btn btn-outline btn-sm" disabled={busy}
                onClick={() => setShowRejectBox(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
