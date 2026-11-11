import { useEffect, useState } from 'react'
import { api, toast } from '../../api/api.js'
import { formatSiblingDetails } from '../../utils/family.js'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import PhotoPreview from '../../components/admin/PhotoPreview.jsx'
import AdminPagination from '../../components/admin/AdminPagination.jsx'

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
  const photos = p.photos || []

  const age = basic.dateOfBirth
    ? Math.max(0, Math.floor((Date.now() - new Date(basic.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000)))
    : null

  return (
    <div className="pane">
      <div className="pane-title">{role}</div>

      {photos.length > 0 ? (
        <div className="admin-photo-strip" style={{ marginBottom: 10 }}>
          {photos.map((ph) => <PhotoPreview key={ph.id} src={ph.url} alt="Photo" />)}
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
      ]} />

      <Group title="Community" rows={[
        ['Religion', community.religion],
        ['Caste', community.caste],
        ['Gotra', community.gotra],
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
        ["Father's age", family.fatherAge],
        ['Mother', family.motherName && `${family.motherName}${family.motherOccupation ? ` (${family.motherOccupation})` : ''}`],
        ["Mother's age", family.motherAge],
        ['Brothers', family.brothers],
        ['Brother details', formatSiblingDetails(family.brotherDetails, family.brotherNames, 'Wife')],
        ['Sisters', family.sisters],
        ['Sister details', formatSiblingDetails(family.sisterDetails, family.sisterNames, 'Husband')],
        ['Native place', family.nativePlace],
      ]} />

      <Group title="Lifestyle" rows={[
        ['Diet', lifestyle.diet],
        ['Smoking', lifestyle.smoking],
        ['Drinking', lifestyle.drinking],
        ['Hobbies', lifestyle.hobbies],
        ['Willing to relocate', lifestyle.willingToRelocate],
      ]} />

    </div>
  )
}

export default function AdminRequestsPage() {
  const [tab, setTab] = useState('pending')
  const [items, setItems] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')

  const [openId, setOpenId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmation, setConfirmation] = useState(null)

  const load = async () => {
    setLoading(true)
    setListError('')
    try {
      const data = await api(`/admin/requests?status=${tab}&page=${page}`)
      setItems(data.data.items)
      setTotalPages(data.data.totalPages)
    } catch (err) {
      setListError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [tab, page]) // eslint-disable-line react-hooks/exhaustive-deps

  const openDetail = async (id) => {
    setOpenId(id)
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
    setConfirmation(null)
    setBusy(true)
    try {
      const data = await api(`/admin/requests/${openId}/approve`, { method: 'POST' })
      toast.success(data.message || 'Request approved and users connected.')
      await Promise.all([load(), openDetail(openId)])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  const doReject = async () => {
    setConfirmation(null)
    setBusy(true)
    try {
      const data = await api(`/admin/requests/${openId}/reject`, { method: 'POST', body: { reason: reason.trim() } })
      toast.success(data.message || 'Request rejected.')
      setRejectOpen(false)
      setReason('')
      await Promise.all([load(), openDetail(openId)])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="admin-section-header">
        <h1>Interest Requests</h1>
        <p>Manage and review all incoming interest requests.</p>
      </div>

      <div className="admin-tab-bar" role="tablist" aria-label="Interest request tabs">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            className={`admin-tab ${tab === t.value ? 'admin-tab--active' : ''}`}
            onClick={() => { setTab(t.value); setPage(1); setOpenId(null); setDetail(null) }}
          >
            <span>{t.label}</span>
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
      {!loading && !openId && items?.length > 0 && (
        <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      {/* side-by-side detail */}
      {openId && (
        <div>
          <div className="admin-detail-top">
            <button type="button" className="btn btn-outline btn-sm"
              onClick={() => { setOpenId(null); setDetail(null) }}>
              ← Back to {tab === 'all' ? 'all' : tab} requests
            </button>
          </div>

          {detailLoading && <div className="page-loading">Loading both profiles…</div>}
          {detailError && <p className="form-error">{detailError}</p>}
          {detail && (
            <>
              <div className="side-by-side">
                <ProfilePane role="Sender" profile={detail.sender?.profile} account={detail.sender?.account} />
                <ProfilePane role="Receiver" profile={detail.receiver?.profile} account={detail.receiver?.account} />
              </div>

              <div className="wizard-card" style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button type="button" className="btn btn-primary" disabled={busy || detail.request?.status !== 'pending'}
                    onClick={() => setConfirmation({
                      title: 'Approve this request?',
                      message: 'Both users will become connected and will be notified.',
                      confirmLabel: 'Approve & connect',
                      action: doApprove,
                    })}>
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
                      placeholder="Add any relevant details for the member."
                      value={reason} onChange={(e) => setReason(e.target.value)} />
                    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                      <button type="button" className="btn btn-danger btn-sm" disabled={busy}
                        onClick={() => setConfirmation({
                          title: 'Reject this request?',
                          message: reason.trim()
                            ? 'The sender will be notified that the request was rejected.'
                            : 'Reject this request without providing a reason?',
                          confirmLabel: 'Reject request',
                          danger: true,
                          action: doReject,
                        })}>
                        {busy ? 'Please wait…' : 'Confirm rejection'}
                      </button>
                      <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => setRejectOpen(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                <ConfirmDialog
                  open={!!confirmation}
                  title={confirmation?.title}
                  message={confirmation?.message}
                  confirmLabel={confirmation?.confirmLabel}
                  danger={confirmation?.danger}
                  busy={busy}
                  onCancel={() => setConfirmation(null)}
                  onConfirm={() => confirmation?.action()}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
