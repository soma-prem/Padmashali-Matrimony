import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api/api.js'

const STATUS_UI = {
  draft: {
    chip: 'status-chip status-chip--draft',
    label: 'Draft',
    message: '📝 Complete your profile — fill every step and submit it for approval.',
    action: { label: 'Complete profile', to: '/profile' },
  },
  pending_approval: {
    chip: 'status-chip status-chip--pending_approval',
    label: 'Under review',
    message: '⏳ Your profile is under review. You will be notified.',
    action: { label: 'View profile', to: '/profile' },
  },
  approved: {
    chip: 'status-chip status-chip--approved',
    label: 'Approved',
    message: '✅ Your profile is approved. Once your payment is verified, an admin can assign you a match.',
  },
  rejected: {
    chip: 'status-chip status-chip--rejected',
    label: 'Rejected',
    message: '❌ Your profile needs changes.',
    action: { label: 'Edit & Resubmit', to: '/profile' },
  },
}

export default function UserDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await api('/profile/me') // also creates the empty draft
        if (!cancelled) setProfile(data.data.profile)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const status = profile?.status ?? 'draft'
  const ui = STATUS_UI[status]
  const percent = profile?.completionPercent ?? 0

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <h1 className="dashboard-title">
          Welcome, <span className="accent">{user.name}</span>
        </h1>
        <p className="dashboard-sub">This is your matrimony dashboard.</p>

        {loading && <div className="page-loading">Loading your profile…</div>}
        {error && <p className="form-error">{error}</p>}

        {profile && !loading && (
          <div className="dash-status">
            <div className="profile-topbar-row">
              <span className={ui.chip}>{ui.label}</span>
              <span className="dash-percent"><strong>{percent}%</strong> complete</span>
            </div>
            <div className="profile-progress">
              <div className="profile-progress-fill" style={{ width: `${percent}%` }} />
            </div>
            <p className="dash-status-message">
              {status === 'approved' && profile.paymentRequired
                ? '✅ Your profile is approved. The admin will send a payment request; a match can be assigned after your payment is verified.'
                : ui.message}
            </p>
            {status === 'rejected' && profile.rejectionReason && (
              <p className="dash-status-reason">Reason: {profile.rejectionReason}</p>
            )}
            {status === 'approved' && profile.paymentRequired ? (
              <div style={{ marginTop: 12 }}>
                <Link to="/payment" className="btn btn-primary dash-action-btn">Payment details</Link>
                <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text)' }}>
                  🔒 Your payment must be verified before an admin can assign your match.
                </p>
              </div>
            ) : status === 'approved' ? (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                <Link to="/browse" className="btn btn-primary dash-action-btn">
                  Assigned matches
                </Link>
              </div>
            ) : (
              <div>
                <span className="btn btn-primary dash-action-btn" style={{ opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' }}>
                  Assigned matches
                </span>
                <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text)' }}>
                  🔒 Your profile must be approved and payment verified before an admin can assign your match.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="dashboard-actions">
          <button type="button" className="btn btn-outline" onClick={() => navigate('/profile')}>
            Profile
          </button>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/notifications')}>
            Notifications
          </button>
          <button type="button" className="btn btn-outline" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
