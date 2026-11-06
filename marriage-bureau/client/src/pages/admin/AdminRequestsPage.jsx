import { useEffect, useState } from 'react'
import { api } from '../../api/api.js'

const TABS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
]

function Row({ k, v }) {
  const text = v === null || v === undefined || v === '' ? '—'
    : typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)
  return <div><span className="k">{k}</span><span className="v">{text}</span></div>
}

function Group({ title, rows }) {
  return (
    <div className="review-group">
      <h4>{title}</h4>
      <div className="review-list">{rows.map(([label, value]) => <Row key={label} k={label} v={value} />)}</div>
    </div>
  )
}

/** full profile pane for the side-by-side comparison */
function ProfilePane({ role, profile, account }) {
  const p = profile ?? {}
  const basic = p.basic ?? {}
  const community = p.community ?? {}
  const edu = p.educationCareer ?? {}
  const family = p.family ?? {}
  const horo = p.horoscope ?? {}
  const lifestyle = p.lifestyleLocation ?? {}
  const prefs = p.preferences ?? {}
  const photos = p.photos || []

  const age = basic.dateOfBirth
    ? Math.max(0, Math.floor((Date.now() - new Date(basic.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000)))
    : null

  return (
    <div className="pane">
      <div className="pane-title">{role}</div>

      {photos.length > 0 ? (
        <div className="admin-photo-strip" style={{ marginBottom: 10 }}>
          {photos.map((ph) => <img key={ph.id} src={ph.url} alt="Photo" />)}
        </div>
      ) : <Row k="Photos" v="No photos" />}

      <div className="detail-hero" style={{ marginBottom: 8 }}>
        <div>
          <div className="browse-card-name" style={{ fontSize: 17 }}>{basic.name || account?.name || '(no name)'}</div>
          <div className="admin-item-meta">
            <span className={`status-chip status-chip--${p.status}`}>{p.status?.replace('_', ' ')}</span>
            <span>{account?.email}</span>
          </div>
          <div className="admin-item-meta">
            <span>{basic.gender === 'male' ? '♂ Male' : '♀ Female'}</span>
            <span>{age ? `${age} yrs` : ''}</span>
            <span>{[lifestyle.city, lifestyle.state].filter(Boolean).join(', ') || '—'}</span>
          </div>
        </div>
      </div>

      {/* private contact details — admin only view */}
      <div className="admin-contact-box">
        <h4>Contact details</h4>
        <div className="review-list">
          <Row k="Mobile" v={p.contact?.mobile} />
          <Row k="WhatsApp" v={p.contact?.whatsapp} />
          <Row k="Email" v={p.contact?.email} />
          <Row k="Address" v={p.contact?.address} />
        </div>
      </div>

      <Group title="Basic" rows={[
        ['Height', basic.heightCm && `${basic.heightCm} cm`],
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
      ]} />

      <Group title="Education &amp; Career" rows={[
        ['Qualification', edu.highestQualification],
        ['College', edu.college],
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

      <Group title="Lifestyle" rows={[
        ['Diet', lifestyle.diet],
        ['Smoking', lifestyle.smoking],
        ['Drinking', lifestyle.drinking],
        ['Hobbies', lifestyle.hobbies],
        ['Willing to relocate', lifestyle.willingToRelocate],
      ]} />

      <Group title="Partner Preferences" rows={[
        ['Age range', prefs.minAge && `${prefs.minAge} – ${prefs.maxAge ?? '?'} yrs`],
        ['Height range', prefs.minHeightCm && `${prefs.minHeightCm} – ${prefs.maxHeightCm ?? '?'} cm`],
        ['Education', prefs.education],
        ['Location', prefs.location],
      ]} />
    </div>
  )
}

export default function AdminRequestsPage() {
  const [tab, setTab] = useState('pending')
  const [items, setItems] = useState(null)
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')

  const [openId, setOpenId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [actionError, setActionError] = useState('')
  const [message, setMessage] = useState('')
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    setListError('')
    try {
      const data = await api(`/admin/requests?status=${tab}`)
      setItems(data.data.items)
    } catch (err) {
      setListError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const openDetail = async (id, { keepMessage = false } = {}) => {
    setOpenId(id)
    if (!keepMessage) setMessage('')
    setActionError('')
    setDetailLoading(true)
    try {
      const data = await api(`/admin/requests/${id}`)
      setDetail(data.data)
    } catch (err) {
      setDetailError(err.message)
    } finally {
      setDetailLoading(false)
    }
  }

  const doApprove = async () => {
    if (!window.confirm('Approve this request? BOTH users become connected.')) return
    setBusy(true); setActionError(''); setMessage('')
    try {
      const data = await api(`/admin/requests/${openId}/approve`, { method: 'POST' })
      setMessage(data.message)
      await Promise.all([load(), openDetail(openId, { keepMessage: true })])
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const doReject = async () => {
    setBusy(true); setActionError(''); setMessage('')
    try {
      const data = await api(`/admin/requests/${openId}/reject`, { method: 'POST', body: { reason: reason.trim() } })
      setMessage(data.message)
      setRejectOpen(false)
      setReason('')
      await Promise.all([load(), openDetail(openId, { keepMessage: true })])
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h1 className="dashboard-title" style={{ marginBottom: 12 }}>Interest Requests</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button key={t.value} type="button"
            className={`btn btn-sm ${tab === t.value ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setTab(t.value); setOpenId(null); setDetail(null) }}>
            {t.label}
          </button>
        ))}
      </div>

      {listError && <p className="form-error">{listError}</p>}
      {loading && <div className="page-loading">Loading requests…</div>}

      {!loading && !openId && (items || []).length === 0 && (
        <div className="notifications-empty">No {tab === 'all' ? '' : tab + ' '}requests.</div>
      )}

      {!loading && !openId && (items || []).length > 0 && (
        <div className="admin-list">
          {(items || []).map((r) => (
            <div className="request-row" key={r.id} style={{ flexWrap: 'wrap' }}>
              <div className="request-row-main">
                <div className="admin-item-name">
                  {r.sender?.name ?? '(missing)'} <span style={{ fontSize: 12 }}>→</span> {r.receiver?.name ?? '(missing)'}
                </div>
                <div className="admin-item-meta">
                  <span className={`status-chip status-chip--${r.status === 'pending' ? 'pending_approval' : r.status}`}>
                    {r.status}
                  </span>
                  <span>{new Date(r.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  <span>{r.sender?.city || '—'} → {r.receiver?.city || '—'}</span>
                </div>
              </div>
              <div className="request-row-actions">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => openDetail(r.id)}>
                  View side by side
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* side-by-side detail */}
      {openId && (
        <div>
          <div className="admin-detail-top">
            <button type="button" className="btn btn-outline btn-sm"
              onClick={() => { setOpenId(null); setDetail(null); setMessage('') }}>
              ← Back to {tab === 'all' ? 'all' : tab} requests
            </button>
          </div>

          {detailLoading && <div className="page-loading">Loading both profiles…</div>}
          {detailError && <p className="form-error">{detailError}</p>}
          {message && <div className="profile-banner profile-banner--success" role="status">✔ {message}</div>}
          {actionError && <div className="profile-banner profile-banner--error" role="alert">{actionError}</div>}

          {detail && (
            <>
              <div className="side-by-side">
                <ProfilePane role="Sender" profile={detail.sender?.profile} account={detail.sender?.account} />
                <ProfilePane role="Receiver" profile={detail.receiver?.profile} account={detail.receiver?.account} />
              </div>

              <div className="wizard-card" style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button type="button" className="btn btn-primary" disabled={busy || detail.request?.status !== 'pending'} onClick={doApprove}>
                    {detail.request?.status === 'approved' ? 'Already approved ✓' : 'Approve & connect'}
                  </button>
                  <button type="button" className="btn btn-danger" disabled={busy || detail.request?.status !== 'pending'} onClick={() => setRejectOpen(true)}>
                    Reject
                  </button>
                  <span className={`status-chip status-chip--${['pending', 'rejected'].includes(detail.request?.status) && detail.request?.status === 'pending' ? 'pending_approval' : detail.request?.status === 'approved' ? 'approved' : 'rejected'}`}>
                    {detail.request?.status}
                  </span>
                </div>

                {rejectOpen && (
                  <div className="reject-box">
                    <label htmlFor="req-reason" style={{ fontWeight: 700, fontSize: 14 }}>
                      Reason (optional — only the sender is notified)
                    </label>
                    <textarea id="req-reason" className="form-input" rows={2} maxLength={500}
                      placeholder="e.g. The profiles differ in partner preferences — please re-check before resending."
                      value={reason} onChange={(e) => setReason(e.target.value)} />
                    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                      <button type="button" className="btn btn-danger btn-sm" disabled={busy} onClick={doReject}>
                        {busy ? 'Please wait…' : 'Confirm rejection'}
                      </button>
                      <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => setRejectOpen(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
