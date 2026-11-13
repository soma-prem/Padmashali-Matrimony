import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, apiUpload, toast } from '../../api/api.js'
import { formatSiblingDetails } from '../../utils/family.js'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import PhotoPreview from '../../components/admin/PhotoPreview.jsx'
import ProfileTimeline from '../../components/ProfileTimeline.jsx'
import { useLanguage } from '../../context/LanguageContext.jsx'

function ReviewGroup({ title, children }) {
  const { t } = useLanguage()
  return (
    <div className="review-group">
      <h4>{t(title)}</h4>
      <div className="review-list">{children}</div>
    </div>
  )
}

function Row({ k, v }) {
  const { t } = useLanguage()
  const text = v === null || v === undefined || v === '' ? '—'
    : typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)
  return <div><span className="k">{t(k)}</span><span className="v">{text}</span></div>
}

function fmtDate(v) {
  if (!v) return '—'
  return new Date(v).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export default function AdminProfileDetailPage() {
  const { t } = useLanguage()
  const { userId } = useParams()
  const navigate = useNavigate()

  const [payload, setPayload] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showRejectBox, setShowRejectBox] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [paymentBusy, setPaymentBusy] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentQr, setPaymentQr] = useState(null)
  const [paymentInputKey, setPaymentInputKey] = useState(0)
  const [confirmation, setConfirmation] = useState(null)

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
    setConfirmation(null)
    setBusy(true)
    try {
      const data = await api(`/admin/profiles/${userId}/approve`, { method: 'POST' })
      toast.success(data.message || t('Profile approved.'))
      await load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  const doReject = async () => {
    if (reason.trim().length < 5) {
      toast.error(t('Give a reason of at least 5 characters.'))
      return
    }
    setConfirmation(null)
    setBusy(true)
    try {
      const data = await api(`/admin/profiles/${userId}/reject`, {
        method: 'POST',
        body: { reason: reason.trim() },
      })
      toast.success(data.message || t('Profile rejected.'))
      setReason('')
      setShowRejectBox(false)
      await load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  const sendPaymentRequest = async (event) => {
    event.preventDefault()
    if (!paymentQr) {
      toast.error(t('Choose the payment QR/scanner image.'))
      return
    }

    setPaymentBusy(true)
    try {
      const data = await apiUpload(`/admin/profiles/${userId}/payment-request`, {
        file: paymentQr,
        fields: { amount: paymentAmount },
      })
      toast.success(data.message || t('Payment request sent.'))
      setPaymentQr(null)
      setPaymentInputKey((key) => key + 1)
      setPaymentAmount('')
      await load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setPaymentBusy(false)
    }
  }

  const retryPaymentUnlock = async () => {
    setPaymentBusy(true)
    try {
      const data = await api(`/admin/payments/${payment.id}/verify`, { method: 'POST' })
      toast.success(data.message || t('Payment verified.'))
      await load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setPaymentBusy(false)
    }
  }

  if (loading) return <div className="page-loading">{t('Loading profile…')}</div>
  if (error) {
    return (
      <div className="dashboard-card">
        <p className="form-error">{error}</p>
        <Link to="/admin/profiles" className="btn btn-outline">← {t('Back to list')}</Link>
      </div>
    )
  }

  const { profile, account, payment } = payload
  const canApprove = profile.status === 'pending_approval'
  const photos = profile.photos || []

  return (
    <div>
      <div className="admin-detail-top">
        <div>
          <h1 className="dashboard-title" style={{ marginBottom: 4 }}>{profile.basic?.name || 'Profile'}</h1>
        </div>
        <Link to="/admin/profiles" className="btn btn-outline btn-sm">← {t('Back to list')}</Link>
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
            {t('Rejection reason')}: {profile.rejectionReason}
          </p>
        )}
      </div>

      <div className="profile-status-timeline">
        <ProfileTimeline
          status={profile.status}
          paymentStatus={payment?.status}
          paymentRequired={profile.paymentRequired}
          variant="compact"
          title={null}
        />
      </div>

      <div className="wizard-card" style={{ marginBottom: 14 }}>
        {/* photos */}
        <ReviewGroup title="Photos">
          {photos.length > 0 ? (
            <div className="admin-photo-strip">
              {photos.map((p) => <PhotoPreview key={p.id} src={p.url} alt="Profile photo" />)}
            </div>
          ) : <Row k="Photos" v={t('No photos uploaded')} />}
        </ReviewGroup>

        {/* contact details */}
        <div className="admin-contact-box">
          <h4>{t('Contact details (private — admin and assigned match only)')}</h4>
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
          <Row k="Religion" v={profile.community?.religion} />
          <Row k="Caste" v={profile.community?.caste} />
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
              <PhotoPreview src={profile.horoscope.kundliImageUrl} alt="Kundli"
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
          <Row k="Father's age" v={profile.family?.fatherAge} />
          <Row k="Mother" v={profile.family?.motherName && `${profile.family.motherName}${profile.family.motherOccupation ? ` (${profile.family.motherOccupation})` : ''}`} />
          <Row k="Mother's age" v={profile.family?.motherAge} />
          <Row k="Brothers" v={profile.family?.brothers} />
          <Row k="Brother details" v={formatSiblingDetails(profile.family?.brotherDetails, profile.family?.brotherNames, 'Wife')} />
          <Row k="Sisters" v={profile.family?.sisters} />
          <Row k="Sister details" v={formatSiblingDetails(profile.family?.sisterDetails, profile.family?.sisterNames, 'Husband')} />
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

      </div>

      {/* actions */}
      <div className="wizard-card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" disabled={!canApprove || busy}
            onClick={() => setConfirmation({
              title: t('Approve profile?'),
              message: t('The user will be notified that their profile is approved. They become eligible for an admin-assigned match after payment is verified.'),
              confirmLabel: t('Approve'),
              action: doApprove,
            })}>
            {t(profile.status === 'approved' ? 'Already approved' : profile.status === 'draft' ? 'Not submitted yet' : 'Approve')}
          </button>
          <button type="button" className="btn btn-danger" disabled={profile.status !== 'pending_approval' || busy}
            onClick={() => setShowRejectBox(true)}>
            {t('Reject with reason')}
          </button>
        </div>

        {profile.status === 'approved' && profile.paymentRequired && !payment && (
          <form className="reject-box" onSubmit={sendPaymentRequest}>
            <h3 style={{ margin: '0 0 8px' }}>{t('Send membership payment request')}</h3>
            <p style={{ margin: '0 0 10px', fontSize: 13 }}>
              {t('The member is not eligible for an admin-assigned match until payment is verified.')}
            </p>
            <label className="form-label" htmlFor="membership-amount">{t('Amount (INR)')}</label>
            <input id="membership-amount" className="form-input" type="number" min="1" step="0.01"
              required value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} />
            <label className="form-label" htmlFor="membership-qr">{t('Payment QR/scanner image')}</label>
            <input key={paymentInputKey} id="membership-qr" className="form-input" type="file" accept="image/jpeg,image/png,image/webp"
              required onChange={(event) => setPaymentQr(event.target.files?.[0] ?? null)} />
            <button type="submit" className="btn btn-primary" disabled={paymentBusy} style={{ marginTop: 12 }}>
              {paymentBusy ? t('Sending…') : t('Send payment request')}
            </button>
          </form>
        )}
        {profile.status === 'approved' && profile.paymentRequired && payment?.status === 'verified' && (
          <div className="reject-box">
            <p style={{ margin: '0 0 10px' }}>{t('Payment is verified; retry activating assignment eligibility if the previous update failed.')}</p>
            <button type="button" className="btn btn-primary" disabled={paymentBusy} onClick={retryPaymentUnlock}>
              {paymentBusy ? t('Please wait…') : t('Retry payment activation')}
            </button>
          </div>
        )}

        {showRejectBox && (
          <div className="reject-box">
            <label htmlFor="reject-reason" style={{ fontWeight: 700, fontSize: 14 }}>{t('Reason (shown to the user)')}</label>
            <textarea id="reject-reason" className="form-input" rows={3} maxLength={500}
              placeholder={t('e.g. About me is missing — write at least 3 sentences about yourself.')}
              value={reason} onChange={(e) => setReason(e.target.value)} />
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button type="button" className="btn btn-danger btn-sm" disabled={busy} onClick={() => {
                if (reason.trim().length < 5) {
                  toast.error(t('Give a reason of at least 5 characters.'))
                  return
                }
                setConfirmation({
                  title: t('Reject profile?'),
                  message: t('The user will be notified and will see the reason you provided.'),
                  confirmLabel: t('Reject profile'),
                  danger: true,
                  action: doReject,
                })
              }}>
                {busy ? t('Please wait…') : t('Confirm rejection')}
              </button>
              <button type="button" className="btn btn-outline btn-sm" disabled={busy}
                onClick={() => setShowRejectBox(false)}>
                {t('Cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
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
  )
}
