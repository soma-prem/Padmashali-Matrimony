import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/api.js'

function Row({ k, v }) {
  const text = v === null || v === undefined || v === '' ? '—'
    : typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)
  return <div><span className="k">{k}</span><span className="v">{text}</span></div>
}

function Group({ title, rows, children }) {
  return (
    <div className="review-group">
      <h4>{title}</h4>
      <div className="review-list">
        {rows.map(([label, value]) => <Row key={label} k={label} v={value} />)}
        {children}
      </div>
    </div>
  )
}

export default function BrowseDetail() {
  const { profileId } = useParams()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [sending, setSending] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api(`/browse/${profileId}`)
      setProfile(data.data.profile)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [profileId]) // eslint-disable-line react-hooks/exhaustive-deps

  const sendInterest = async () => {
    setSending(true)
    setActionError('')
    setActionMessage('')
    try {
      const data = await api('/requests', { method: 'POST', body: { receiverProfileId: profileId } })
      setActionMessage(data.message)
      await load() // refresh relationship status
    } catch (err) {
      setActionError(err.message)
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div className="page-loading">Loading profile…</div>
  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <p className="form-error">{error}</p>
          <Link to="/browse" className="btn btn-outline">← Back to browse</Link>
        </div>
      </div>
    )
  }

  const rel = profile.relationship
  const photos = profile.photos || []
  const basic = profile.basic ?? {}
  const community = profile.community ?? {}
  const edu = profile.educationCareer ?? {}
  const family = profile.family ?? {}
  const horo = profile.horoscope ?? {}
  const lifestyle = profile.lifestyleLocation ?? {}
  const prefs = profile.preferences ?? {}
  const contact = profile.contact // only present when connected

  const age = basic.dateOfBirth
    ? Math.max(0, Math.floor((Date.now() - new Date(basic.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000)))
    : null

  return (
    <div className="dashboard-page">
      <div className="dashboard-card wide">
        <div style={{ marginBottom: 12 }}>
          <Link to="/browse" className="btn btn-outline btn-sm">← Back to browse</Link>
        </div>

        {/* hero */}
        <div className="detail-hero">
          {photos[0]?.url ? (
            <img className="detail-avatar" src={photos[0].url} alt="" />
          ) : (
            <div className="detail-avatar" style={{ display: 'grid', placeItems: 'center', fontSize: 34, fontWeight: 800, color: 'var(--primary-deep)' }}>
              {(basic.name || '?').slice(0, 1)}
            </div>
          )}
          <div className="detail-headline">
            <h1 className="detail-name">{basic.name}</h1>
            <p className="detail-sub">
              {[
                basic.gender === 'male' ? 'Male' : 'Female',
                age ? `${age} yrs` : null,
                basic.heightCm ? `${basic.heightCm} cm` : null,
                [lifestyle.city, lifestyle.state].filter(Boolean).join(', ') || null,
              ].filter(Boolean).join(' • ')}
            </p>
            <p className="detail-sub">
              {edu.highestQualification ? `${edu.highestQualification}${edu.occupation ? ` • ${edu.occupation}` : ''}` : ''}
            </p>
          </div>
        </div>

        {/* photo gallery */}
        {photos.length > 1 && (
          <div className="detail-gallery">
            {photos.map((p) => <img key={p.id} src={p.url} alt="Profile photo" />)}
          </div>
        )}

        {/* interest actions */}
        <div className="detail-locked-note">
          🔒 Contact details unlock after admin approval of an interest request.
        </div>

        {rel === 'connected' && (
          <div className="detail-connect-box">
            ✅ You are connected with {basic.name}. The contact details are below —
            or open <strong>My Connections</strong> anytime.
          </div>
        )}

        {actionMessage && <div className="profile-banner profile-banner--success" role="status">✔ {actionMessage}</div>}
        {actionError && <div className="profile-banner profile-banner--error" role="alert">{actionError}</div>}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '6px 0 16px' }}>
          {rel === 'none' && (
            <button type="button" className="btn btn-primary" disabled={sending} onClick={sendInterest}>
              {sending ? 'Sending…' : 'Send Interest'}
            </button>
          )}
          {rel === 'request_pending' && (
            <button type="button" className="btn btn-outline" disabled>
              ⏳ Request pending — admin review in progress
            </button>
          )}
          {rel === 'connected' && (
            <button type="button" className="btn btn-primary" onClick={() => navigate('/connections')}>
              Open My Connections
            </button>
          )}
          {rel === 'request_rejected' && (
            <button type="button" className="btn btn-outline" disabled title="An earlier request was rejected">
              Request rejected — not possible
            </button>
          )}
        </div>

        {contact && (
          <div className="admin-contact-box">
            <h4>Contact details (visible because you are connected)</h4>
            <div className="review-list">
              <Row k="Mobile" v={contact.mobile} />
              <Row k="WhatsApp" v={contact.whatsapp} />
              <Row k="Email" v={contact.email} />
              <Row k="Address" v={contact.address} />
            </div>
          </div>
        )}

        {/* sections */}
        <div className="review-grid">
          <Group title="Basic &amp; Community" rows={[
            ['Gender', basic.gender],
            ['Date of birth', basic.dateOfBirth],
            ['Height', basic.heightCm && `${basic.heightCm} cm`],
            ['Weight', basic.weightKg && `${basic.weightKg} kg`],
            ['Marital status', basic.maritalStatus],
            ['Mother tongue', basic.motherTongue],
            ['About me', basic.aboutMe],
            ['Caste', community.caste],
            ['Sub-caste / Kulam', community.subCasteKulam],
          ]} />

          <Group title="Horoscope" rows={[
            ['Time of birth', horo.timeOfBirth],
            ['Place of birth', horo.placeOfBirth],
            ['Rashi', horo.rashi],
            ['Nakshatra', horo.nakshatra],
            ['Pada', horo.pada],
            ['Manglik', horo.manglik],
          ]}>
            {horo.kundliImageUrl && (
              <div style={{ marginTop: 8 }}>
                <span className="k">Kundli image</span>
                <img src={horo.kundliImageUrl} alt="Kundli"
                  style={{ maxWidth: '100%', maxHeight: 260, objectFit: 'contain', border: '1px solid var(--border)', borderRadius: 8, marginTop: 6 }} />
              </div>
            )}
          </Group>

          <Group title="Education &amp; Career" rows={[
            ['Qualification', edu.highestQualification],
            ['College', edu.college],
            ['Field', edu.fieldOfStudy],
            ['Occupation', edu.occupation],
            ['Company', edu.company],
            ['Annual income', edu.annualIncome],
          ]} />

          <Group title="Family" rows={[
            ['Father', family.fatherName && `${family.fatherName}${family.fatherOccupation ? ` (${family.fatherOccupation})` : ''}`],
            ['Mother', family.motherName && `${family.motherName}${family.motherOccupation ? ` (${family.motherOccupation})` : ''}`],
            ['Brothers', family.brothers],
            ['Sisters', family.sisters],
            ['Family type', family.familyType],
            ['Family values', family.familyValues],
            ['Native place', family.nativePlace],
          ]} />

          <Group title="Lifestyle &amp; Location" rows={[
            ['Diet', lifestyle.diet],
            ['Smoking', lifestyle.smoking],
            ['Drinking', lifestyle.drinking],
            ['Hobbies', lifestyle.hobbies],
            ['City', lifestyle.city],
            ['State', lifestyle.state],
            ['Country', lifestyle.country],
            ['Willing to relocate', lifestyle.willingToRelocate],
          ]} />

          <Group title="Partner Preferences" rows={[
            ['Age range', prefs.minAge && `${prefs.minAge} – ${prefs.maxAge ?? '?'} yrs`],
            ['Height range', prefs.minHeightCm && `${prefs.minHeightCm} – ${prefs.maxHeightCm ?? '?'} cm`],
            ['Education', prefs.education],
            ['Location', prefs.location],
            ['Marital status', prefs.maritalStatus],
          ]} />
        </div>
      </div>
    </div>
  )
}
