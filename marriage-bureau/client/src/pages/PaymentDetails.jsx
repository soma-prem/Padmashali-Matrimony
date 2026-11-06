import { useEffect, useState } from 'react'
import { api, apiUpload } from '../api/api.js'
import PhotoPreview from '../components/admin/PhotoPreview.jsx'

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
      setError('Choose a screenshot of your completed payment.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const response = await apiUpload('/payment/submit', {
        file: screenshot,
        fields: { utrNumber },
      })
      setPayment(response.data.payment)
      setUtrNumber('')
      setScreenshot(null)
      setInputKey((key) => key + 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = payment && ['requested', 'rejected'].includes(payment.status)

  return (
    <div className="dashboard-page payment-page">
      <div className="dashboard-card">
        <h1 className="dashboard-title">Payment details</h1>
        <p className="dashboard-sub">View your membership payment request and submit payment proof for verification.</p>

        {loading && <div className="page-loading">Loading payment details…</div>}
        {error && <p className="form-error" role="alert">{error}</p>}

        {!loading && !error && !payment && (
          <div className="payment-empty">
            <h2>Payment request not sent yet</h2>
            <p>Your profile must be approved first. The admin will send the amount and QR/scanner image here.</p>
          </div>
        )}

        {!loading && payment && (
          <>
            <div className={`payment-status payment-status--${payment.status}`} role="status">
              {STATUS_LABELS[payment.status] || payment.status}
            </div>

            <dl className="payment-summary">
              <div><dt>Request date and time</dt><dd>{fmtDate(payment.requestSentAt)}</dd></div>
              <div>
                <dt>Amount</dt>
                <dd>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(payment.amount)}</dd>
              </div>
              {payment.submittedAt && <div><dt>Payment submitted</dt><dd>{fmtDate(payment.submittedAt)}</dd></div>}
              {payment.reviewedAt && <div><dt>Last reviewed</dt><dd>{fmtDate(payment.reviewedAt)}</dd></div>}
              {payment.utrNumber && <div><dt>UTR number</dt><dd>{payment.utrNumber}</dd></div>}
            </dl>

            {payment.rejectionReason && <p className="form-error">{payment.rejectionReason}</p>}

            <div className="payment-qr">
              <h2>Scan to pay</h2>
              <PhotoPreview
                src={payment.qrImageUrl}
                alt="Membership payment QR code"
                className="payment-qr-image"
              />
              <p>Use your payment app to scan the QR code. After paying, enter the UTR number and upload your payment screenshot below.</p>
            </div>

            {payment.paymentScreenshotUrl && (
              <div className="payment-qr">
                <h2>Your payment screenshot</h2>
                <PhotoPreview
                  src={payment.paymentScreenshotUrl}
                  alt="Your submitted payment screenshot"
                  className="payment-qr-image"
                />
              </div>
            )}

            {payment.status === 'submitted' && (
              <p className="form-success">Your UTR and screenshot have been sent to the admin. You can browse profiles after verification.</p>
            )}
            {payment.status === 'verified' && (
              <p className="form-success">Your payment is verified. You can now browse profiles.</p>
            )}

            {canSubmit && (
              <form className="payment-submit-form" onSubmit={submit}>
                <h2>{payment.status === 'rejected' ? 'Resubmit payment details' : 'Submit payment details'}</h2>
                <label className="form-label" htmlFor="payment-utr">UTR number</label>
                <input id="payment-utr" className="form-input" required minLength={6} maxLength={50}
                  pattern="[A-Za-z0-9][A-Za-z0-9/-]{5,49}"
                  title="Use 6–50 letters, numbers, / or -."
                  value={utrNumber} onChange={(event) => setUtrNumber(event.target.value)} />
                <label className="form-label" htmlFor="payment-screenshot">Payment screenshot</label>
                <input key={inputKey} id="payment-screenshot" className="form-input" type="file"
                  accept="image/jpeg,image/png,image/webp" required
                  onChange={(event) => setScreenshot(event.target.files?.[0] ?? null)} />
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: 16 }}>
                  {submitting ? 'Submitting…' : 'Send payment for verification'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
