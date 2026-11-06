import { useEffect, useRef, useState } from 'react'
import { api } from '../api/api.js'
import StepBasic from '../components/profileSteps/StepBasic.jsx'
import StepCommunity from '../components/profileSteps/StepCommunity.jsx'
import StepHoroscope from '../components/profileSteps/StepHoroscope.jsx'
import StepEducationCareer from '../components/profileSteps/StepEducationCareer.jsx'
import StepFamily from '../components/profileSteps/StepFamily.jsx'
import StepLifestyleLocation from '../components/profileSteps/StepLifestyleLocation.jsx'
import StepPhotos from '../components/profileSteps/StepPhotos.jsx'
import StepPreferences from '../components/profileSteps/StepPreferences.jsx'
import StepContact from '../components/profileSteps/StepContact.jsx'
import StepReview from '../components/profileSteps/StepReview.jsx'
import { SUBMIT_MIN_PERCENT } from '../utils/profileOptions.js'

const STEPS = [
  { key: 'basic', title: 'Basic', Component: StepBasic, saveable: true },
  { key: 'community', title: 'Community', Component: StepCommunity, saveable: true },
  { key: 'horoscope', title: 'Horoscope', Component: StepHoroscope, saveable: true },
  { key: 'educationCareer', title: 'Education & Career', Component: StepEducationCareer, saveable: true },
  { key: 'family', title: 'Family', Component: StepFamily, saveable: true },
  { key: 'lifestyleLocation', title: 'Lifestyle & Location', Component: StepLifestyleLocation, saveable: true },
  { key: 'photos', title: 'Photos', Component: StepPhotos, saveable: false },
  { key: 'preferences', title: 'Partner Preferences', Component: StepPreferences, saveable: true },
  { key: 'contact', title: 'Contact Details', Component: StepContact, saveable: true },
  { key: 'review', title: 'Review & Submit', Component: StepReview, saveable: false },
]

const STATUS_MESSAGES = {
  draft: 'Complete your profile — fill every step and submit for approval.',
  pending_approval: 'Your profile is under review. You will be notified.',
  approved: '✅ Your profile is approved!',
  rejected: '',
}

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')

  // local draft per section so users don't lose edits between Save presses
  const [drafts, setDrafts] = useState({})

  const loadProfile = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const data = await api('/profile/me')
      setProfile(data.data.profile)
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  // seed drafts from server data whenever a fresh profile arrives
  useEffect(() => {
    if (!profile) return
    setDrafts((prev) => {
      const next = {}
      for (const s of STEPS) {
        if (!s.saveable) continue
        const fresh = profile[s.key]
        if (prev[s.key] === undefined) {
          next[s.key] = { ...(fresh || {}) }
        } else {
          next[s.key] = { ...prev[s.key] }
        }
      }
      return next
    })
  }, [profile])

  const readOnly = profile && ['pending_approval', 'approved'].includes(profile.status)

  if (loading) {
    return <div className="page-loading">Loading your profile…</div>
  }

  if (loadError) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <h1 className="dashboard-title">Profile</h1>
          <p className="form-error">{loadError}</p>
          <p className="auth-switch">
            <button type="button" className="btn btn-outline" onClick={loadProfile}>Try again</button>
          </p>
        </div>
      </div>
    )
  }

  const replaceProfile = (fresh) => setProfile(fresh)

  const persistSection = async (section, value, { successMessage = 'Saved!', advance = true } = {}) => {
    setSaving(true)
    setSaveError('')
    setSaveSuccess('')
    try {
      const data = await api('/profile/me', { method: 'PUT', body: { [section]: value } })
      setProfile(data.data.profile)
      setSaveSuccess(successMessage)
      if (advance) setStep((s) => Math.min(s + 1, STEPS.length - 1))
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const current = STEPS[step]
  const percent = profile?.completionPercent ?? 0

  const goTo = (next) => {
    setSaveError('')
    setSaveSuccess('')
    setStep(Math.max(0, Math.min(next, STEPS.length - 1)))
  }

  const handleSubmit = () => persistSection('submit', {}, {
    successMessage: 'Profile submitted for approval!',
    advance: false,
  }).catch(() => {})

  return (
    <div className="profile-page">
      {/* top bar: status + completion */}
      <div className="profile-topbar">
        <div className="profile-topbar-row">
          <span className="profile-step-label">
            Step {step + 1} of {STEPS.length} — {current.title}
          </span>
          <span className={`status-chip status-chip--${profile.status}`}>
            {profile.status === 'draft' && 'Draft'}
            {profile.status === 'pending_approval' && 'Under review'}
            {profile.status === 'approved' && 'Approved'}
            {profile.status === 'rejected' && 'Rejected — fix & resubmit'}
          </span>
        </div>

        <div className="profile-progress-row">
          <span>Profile completion</span>
          <span><strong>{percent}%</strong> (need {SUBMIT_MIN_PERCENT}% to submit)</span>
        </div>
        <div className="profile-progress" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <div className="profile-progress-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {/* status banners */}
      {profile.status === 'rejected' && (
        <div className="profile-banner" data-role="reason">
          ❌ Your profile was rejected{profile.rejectionReason ? `: ${profile.rejectionReason}` : ''}
        </div>
      )}
      {readOnly && (
        <div className="profile-banner profile-banner--info">
          {STATUS_MESSAGES[profile.status]} The form is read-only until the admin approves it
          {' '}(or asks for changes).
        </div>
      )}
      {readOnly && profile.status === 'approved' && (
        <div className="profile-banner profile-banner--success">
          You can browse other profiles once Stage&nbsp;4 goes live.
        </div>
      )}
      {!readOnly && saveSuccess && (
        <div className="profile-banner profile-banner--success" role="status">✔ {saveSuccess}</div>
      )}
      {!readOnly && saveError && (
        <div className="profile-banner profile-banner--error" role="alert">{saveError}</div>
      )}

      {/* step content */}
      <div className="wizard-card">
        <h2 className="wizard-title">{current.title}</h2>
        {step === STEPS.length - 3 && (
          <p className="wizard-sub">First photo you add becomes your profile photo.</p>
        )}
        {step === STEPS.length - 2 && (
          <p className="wizard-sub">These preferences help us show you better matches later.</p>
        )}
        {step === STEPS.length - 1 && (
          <p className="wizard-sub">Check every section, then submit.</p>
        )}

        {current.key === 'photos' ? (
          <StepPhotos profile={profile} onProfileReplace={replaceProfile} disabled={!!readOnly} />
        ) : current.key === 'review' ? (
          <StepReview
            profile={profile}
            disabled={!!readOnly}
            submitting={saving}
            submitError={saveError}
            onSubmit={handleSubmit}
          />
        ) : (
          <current.Component
            value={drafts[current.key] || {}}
            onChange={(v) => setDrafts((d) => ({ ...d, [current.key]: v }))}
            disabled={readOnly}
            onProfileReplace={replaceProfile}
          />
        )}

        {/* wizard footer */}
        <div className="wizard-actions">
          <div className="left">
            {step > 0 && (
              <button type="button" className="btn btn-outline" onClick={() => goTo(step - 1)}>
                Back
              </button>
            )}
          </div>
          <div className="right">
            {step < STEPS.length - 1 && (
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving}
                onClick={() =>
                  current.saveable && !readOnly
                    ? persistSection(current.key, drafts[current.key] || {})
                    : goTo(step + 1) // Continue " " label
                }
              >
                {saving ? 'Saving…' : current.saveable && !readOnly ? 'Save & Continue' : 'Continue'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
