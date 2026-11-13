import { useEffect, useState } from 'react'
import { api, apiUpload, toast } from '../api/api.js'
import PhotoPreview from '../components/admin/PhotoPreview.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'

const STATUS_LABELS = {
  requested: 'Payment requested',
  submitted: 'Awaiting admin verification',
  rejected: 'Please resubmit payment details',
  verified: 'Payment verified',
}

function fmtDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export default function PaymentDetails() {
  const { t } = useLanguage()
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [utrNumber, setUtrNumber] = useState('')
  const [screenshot, setScreenshot] = useState(null)
  const [inputKey, setInputKey] = useState(0)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api('/payment/me')
      setPayment(response.data.payment)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (event) => {
    event.preventDefault()
    if (!screenshot) {
      toast.error(t('Choose a screenshot of your completed payment.'))
      return
    }

    setSubmitting(true)
    try {
      const response = await apiUpload('/payment/submit', {
        file: screenshot,
        fields: { utrNumber },
      })
      setPayment(response.data.payment)
      toast.success(response.message || t('Payment details sent for verification.'))
      setUtrNumber('')
      setScreenshot(null)
      setInputKey((key) => key + 1)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = payment && ['requested', 'rejected'].includes(payment.status)

  return (
    <div className="dashboard-page payment-page">
      <div className="dashboard-card">
        <h1 className="dashboard-title">{t('Payment details')}</h1>
        <p className="dashboard-sub">{t('View your membership payment request and submit payment proof for verification.')}</p>

        {loading && <div className="page-loading">{t('Loading payment details…')}</div>}
        {error && <p className="form-error" role="alert">{error}</p>}

        {!loading && !error && !payment && (
          <div className="payment-empty">
            <h2>{t('Payment request not sent yet')}</h2>
            <p>{t('Your profile must be approved first. The admin will send the amount and QR/scanner image here.')}</p>
          </div>
        )}

        {!loading && payment && (
          <>
            <div className={`payment-status payment-status--${payment.status}`} role="status">
              {STATUS_LABELS[payment.status] || payment.status}
            </div>

            <dl className="payment-summary">
              <div><dt>{t('Request date and time')}</dt><dd>{fmtDate(payment.requestSentAt)}</dd></div>
              <div>
                <dt>{t('Amount')}</dt>
                <dd>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(payment.amount)}</dd>
              </div>
              {payment.submittedAt && <div><dt>{t('Payment submitted')}</dt><dd>{fmtDate(payment.submittedAt)}</dd></div>}
              {payment.reviewedAt && <div><dt>{t('Last reviewed')}</dt><dd>{fmtDate(payment.reviewedAt)}</dd></div>}
              {payment.utrNumber && <div><dt>{t('UTR number')}</dt><dd>{payment.utrNumber}</dd></div>}
            </dl>

            {payment.rejectionReason && <p className="form-error">{payment.rejectionReason}</p>}

            <div className="payment-qr">
              <h2>{t('Scan to pay')}</h2>
              <PhotoPreview
                src={payment.qrImageUrl}
                alt={t('Membership payment QR code')}
                className="payment-qr-image"
              />
              <p>{t('Use your payment app to scan the QR code. After paying, enter the UTR number and upload your payment screenshot below.')}</p>
            </div>

            {payment.paymentScreenshotUrl && (
              <div className="payment-qr">
                <h2>{t('Your payment screenshot')}</h2>
                <PhotoPreview
                  src={payment.paymentScreenshotUrl}
                  alt={t('Your submitted payment screenshot')}
                  className="payment-qr-image"
                />
              </div>
            )}

            {canSubmit && (
              <form className="payment-submit-form" onSubmit={submit}>
                <h2>{payment.status === 'rejected' ? t('Resubmit payment details') : t('Submit payment details')}</h2>
                <div className="payment-form-row">
                  <label htmlFor="payment-utr">{t('UTR number')}</label>
                  <input id="payment-utr" className="form-input" required minLength={6} maxLength={50}
                    pattern="[A-Za-z0-9][A-Za-z0-9/-]{5,49}"
                    title={t('Use 6–50 letters, numbers, / or -.')}
                    value={utrNumber} onChange={(event) => setUtrNumber(event.target.value)} />
                </div>
                <div className="payment-form-row">
                  <label htmlFor="payment-screenshot">{t('Payment screenshot')}</label>
                  <input key={inputKey} id="payment-screenshot" className="form-input" type="file"
                    accept="image/jpeg,image/png,image/webp" required
                    onChange={(event) => setScreenshot(event.target.files?.[0] ?? null)} />
                </div>
                <div className="payment-form-actions">
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? t('Submitting…') : t('Send payment for verification')}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
