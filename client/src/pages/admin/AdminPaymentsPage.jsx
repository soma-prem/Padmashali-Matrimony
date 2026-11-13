import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, toast } from '../../api/api.js'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import PhotoPreview from '../../components/admin/PhotoPreview.jsx'

function fmtDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export default function AdminPaymentsPage() {
  const [tab, setTab] = useState('submitted')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [confirmation, setConfirmation] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [fromInput, setFromInput] = useState('')
  const [toInput, setToInput] = useState('')
  const [filters, setFilters] = useState({ search: '', from: '', to: '' })

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ status: tab })
      if (filters.search) params.set('search', filters.search)
      if (filters.from) params.set('from', filters.from)
      if (filters.to) params.set('to', filters.to)
      const response = await api(`/admin/payments?${params.toString()}`)
      setItems(response.data.items)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [tab, filters]) // eslint-disable-line react-hooks/exhaustive-deps

  const applyFilters = (event) => {
    event.preventDefault()
    setFilters({
      search: searchInput.trim(),
      from: fromInput,
      to: toInput,
    })
  }

  const clearFilters = () => {
    setSearchInput('')
    setFromInput('')
    setToInput('')
    setFilters({ search: '', from: '', to: '' })
  }

  const runAction = async (item, action) => {
    setConfirmation(null)
    setBusyId(item.id)
    try {
      const response = await api(`/admin/payments/${item.id}/${action}`, { method: 'POST' })
      await load()
      toast.success(response.message || (action === 'verify' ? 'Payment verified.' : 'Payment returned for correction.'))
      return response
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="admin-section-header">
        <h1>Payments</h1>
        <p>Review and verify member payments and proof submissions.</p>
      </div>

      <div className="admin-tab-bar" role="tablist" aria-label="Payments tabs">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'submitted'}
          className={`admin-tab ${tab === 'submitted' ? 'admin-tab--active' : ''}`}
          onClick={() => setTab('submitted')}
        >
          Needs verification
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'verified'}
          className={`admin-tab ${tab === 'verified' ? 'admin-tab--active' : ''}`}
          onClick={() => setTab('verified')}
        >
          Completed
        </button>
      </div>

      <form className="admin-payment-filter-panel" onSubmit={applyFilters}>
        <div className="admin-payment-search-wrap">
          <span className="admin-payment-search-icon" aria-hidden="true">⌕</span>
          <input
            className="form-input admin-payment-search"
            type="search"
            placeholder="Search name, email or UTR…"
            aria-label="Search payments by member name, email, or UTR"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>

        <div className="admin-payment-date-grid">
          <label className="admin-payment-date-filter">
            <span>{tab === 'verified' ? 'Completed from' : 'Submitted from'}</span>
            <input className="form-input" type="date" value={fromInput}
              onChange={(event) => setFromInput(event.target.value)} />
          </label>
          <label className="admin-payment-date-filter">
            <span>{tab === 'verified' ? 'Completed to' : 'Submitted to'}</span>
            <input className="form-input" type="date" value={toInput}
              onChange={(event) => setToInput(event.target.value)} />
          </label>
        </div>

        <div className="admin-payment-actions-row">
          <button type="submit" className="btn btn-primary admin-payment-submit-btn">Apply filters</button>
          <button type="button" className="btn btn-outline admin-payment-clear-btn" onClick={clearFilters}>Clear</button>
        </div>
      </form>
      {error && <p className="form-error" role="alert">{error}</p>}
      {loading && <div className="page-loading">Loading payments…</div>}
      {!loading && !error && items.length === 0 && (
        <div className="notifications-empty">
          {filters.search || filters.from || filters.to
            ? 'No payments match the search or date filters.'
            : tab === 'verified' ? 'No completed payments yet.' : 'No payments are waiting for verification.'}
        </div>
      )}

      <div className={`admin-list${tab === 'verified' ? ' admin-payment-grid' : ''}`}>
        {items.map((item) => (
          <article className="admin-payment-card" key={item.id}>
            <div className="admin-payment-summary">
              <div className="admin-payment-summary-main">
                <h2>{item.profileName || item.accountName || 'Member'}</h2>
                <p>{item.accountEmail}</p>
              </div>
              <div className="admin-payment-summary-data">
                <span>₹{Number(item.amount).toLocaleString('en-IN')}</span>
                <span className={`status-chip ${item.status === 'verified' ? 'status-chip--approved' : 'status-chip--pending_approval'}`}>
                  {item.status === 'verified' ? 'completed' : 'awaiting verification'}
                </span>
                <span>{item.status === 'verified' ? 'Completed' : 'Submitted'}: {fmtDate(item.status === 'verified' ? item.reviewedAt : item.submittedAt)}</span>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                aria-expanded={expandedId === item.id}
                onClick={() => setExpandedId((current) => current === item.id ? null : item.id)}
              >
                {expandedId === item.id ? 'View less' : 'View more'}
              </button>
            </div>
            {expandedId === item.id && (
              <div className="admin-payment-details">
                <div className="admin-payment-heading">
                  <div>
                    <p>Submitted: {fmtDate(item.submittedAt)}</p>
                    {item.status === 'verified' && <p>Completed: {fmtDate(item.reviewedAt)}</p>}
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
                {item.status === 'submitted' && <div className="admin-payment-actions">
                  <button type="button" className="btn btn-primary" disabled={busyId === item.id}
                    onClick={() => setConfirmation({
                      title: 'Verify this payment?',
                      message: 'Confirm that the UTR and payment screenshot match. The member will then be eligible for an admin-assigned match.',
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
                </div>}
              </div>
            )}
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
