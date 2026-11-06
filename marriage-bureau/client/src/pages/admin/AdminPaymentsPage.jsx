import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/api.js'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import PhotoPreview from '../../components/admin/PhotoPreview.jsx'

function fmtDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export default function AdminPaymentsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [confirmation, setConfirmation] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api('/admin/payments')
      setItems(response.data.items)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const runAction = async (item, action) => {
    setConfirmation(null)
    setBusyId(item.id)
    setError('')
    try {
      const response = await api(`/admin/payments/${item.id}/${action}`, { method: 'POST' })
      await load()
      if (action === 'verify') setError('')
      return response
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <h1 className="dashboard-title" style={{ marginBottom: 16 }}>Payment verification</h1>
      {error && <p className="form-error" role="alert">{error}</p>}
      {loading && <div className="page-loading">Loading payment submissions…</div>}
      {!loading && !error && items.length === 0 && (
        <div className="notifications-empty">No payments are waiting for verification.</div>
      )}

      <div className="admin-list">
        {items.map((item) => (
          <article className="dashboard-card admin-payment-card" key={item.id}>
            <div className="admin-payment-heading">
              <div>
                <h2>{item.profileName || item.accountName || 'Member'}</h2>
                <p>{item.accountEmail}</p>
                <p>Submitted: {fmtDate(item.submittedAt)}</p>
              </div>
              <Link to={`/admin/profiles/${item.userId}`} className="btn btn-outline btn-sm">View profile</Link>
            </div>
            <div className="admin-payment-data">
              <div><strong>Amount</strong><span>₹{Number(item.amount).toLocaleString('en-IN')}</span></div>
              <div><strong>UTR number</strong><span>{item.utrNumber}</span></div>
              <div><strong>Request sent</strong><span>{fmtDate(item.requestSentAt)}</span></div>
            </div>
            <div className="admin-payment-images">
              <div>
                <h3>Payment screenshot</h3>
                <PhotoPreview src={item.paymentScreenshotUrl} alt={`${item.profileName || 'Member'} payment screenshot`}
                  className="admin-payment-proof-image" />
              </div>
              <div>
                <h3>Requested QR/scanner</h3>
                <PhotoPreview src={item.qrImageUrl} alt="Payment QR code"
                  className="admin-payment-proof-image" />
              </div>
            </div>
            <div className="admin-payment-actions">
              <button type="button" className="btn btn-primary" disabled={busyId === item.id}
                onClick={() => setConfirmation({
                  title: 'Verify this payment?',
                  message: 'Confirm that the UTR and payment screenshot match. This will unlock profile browsing for the member.',
                  confirmLabel: 'Verify payment',
                  action: () => runAction(item, 'verify'),
                })}>
                Verify payment
              </button>
              <button type="button" className="btn btn-danger" disabled={busyId === item.id}
                onClick={() => setConfirmation({
                  title: 'Return payment for correction?',
                  message: 'The member will be asked to check the UTR and submit a clear screenshot again.',
                  confirmLabel: 'Request resubmission',
                  danger: true,
                  action: () => runAction(item, 'reject'),
                })}>
                Request resubmission
              </button>
            </div>
          </article>
        ))}
      </div>

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
