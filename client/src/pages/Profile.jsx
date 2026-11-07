import { useEffect, useRef, useState } from 'react'
import { api, toast } from '../api/api.js'
import StepBasic from '../components/profileSteps/StepBasic.jsx'
import StepCommunity from '../components/profileSteps/StepCommunity.jsx'
import StepHoroscope from '../components/profileSteps/StepHoroscope.jsx'
import StepEducationCareer from '../components/profileSteps/StepEducationCareer.jsx'
import StepFamily from '../components/profileSteps/StepFamily.jsx'
import StepLifestyleLocation from '../components/profileSteps/StepLifestyleLocation.jsx'
import StepPhotos from '../components/profileSteps/StepPhotos.jsx'
import StepContact from '../components/profileSteps/StepContact.jsx'
import StepReview from '../components/profileSteps/StepReview.jsx'
import { SUBMIT_MIN_PERCENT } from '../utils/profileOptions.js'
import { calculateProfileCompletion } from '../utils/profileCompletion.js'
import { useAuth } from '../context/AuthContext.jsx'
import ProfileTimeline from '../components/ProfileTimeline.jsx'

const STEPS = [
  { key: 'basic', title: 'Basic', Component: StepBasic, saveable: true },
  { key: 'community', title: 'Community', Component: StepCommunity, saveable: true },
  { key: 'horoscope', title: 'Horoscope', Component: StepHoroscope, saveable: true },
  { key: 'educationCareer', title: 'Education & Career', Component: StepEducationCareer, saveable: true },
  { key: 'family', title: 'Family', Component: StepFamily, saveable: true },
  { key: 'lifestyleLocation', title: 'Lifestyle & Location', Component: StepLifestyleLocation, saveable: true },
  { key: 'photos', title: 'Photos', Component: StepPhotos, saveable: false },
  { key: 'contact', title: 'Contact Details', Component: StepContact, saveable: true },
  { key: 'review', title: 'Review & Submit', Component: StepReview, saveable: false },
]
const REVIEW_SECTION_KEYS = STEPS.filter((step) => step.key !== 'review').map((step) => step.key)

const STATUS_MESSAGES = {
  draft: 'Complete your profile — fill every step and submit for approval.',
  pending_approval: 'Your profile is under review. You will be notified.',
  rejected: '',
}

export default function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [confirmedSections, setConfirmedSections] = useState({})
  const [editingSection, setEditingSection] = useState(null)

  const [drafts, setDrafts] = useState({})
  const draftOwner = useRef(null)

  const loadProfile = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const data = await api('/profile/me')
      setProfile(data.data.profile)
    } catch (err) {
      setLoadError(err.message)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  // Restore unsaved profile form data for this account after a reload or logout.
  useEffect(() => {
    if (!profile) return
    const owner = profile.userId
    if (!owner || draftOwner.current === owner) return

    let restored = {}
    try {
      const saved = localStorage.getItem(`mb_profile_draft_${owner}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) restored = parsed
      }
    } catch {
      toast.error('Unable to restore your saved form data from this browser.')
    }

    setDrafts(() => {
      const next = {}
      for (const s of STEPS) {
        if (!s.saveable) continue
        const savedSection = restored[s.key]
        next[s.key] = {
          ...(profile[s.key] || {}),
          ...(savedSection && typeof savedSection === 'object' && !Array.isArray(savedSection)
            ? savedSection
            : {}),
        }
      }
      if (!next.contact?.email && user?.email) {
        next.contact = { ...next.contact, email: user.email }
      }
      return next
    })
    draftOwner.current = owner
  }, [profile, user?.email])

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
    try {
      const data = await api('/profile/me', { method: 'PUT', body: { [section]: value } })
      setProfile(data.data.profile)
      toast.success(successMessage)
      if (advance && editingSection === section) {
        setEditingSection(null)
        goTo(STEPS.length - 1)
      } else if (advance) {
        setStep((s) => Math.min(s + 1, STEPS.length - 1))
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const current = STEPS[step]
  const percent = calculateProfileCompletion(profile, drafts)

  const goTo = (next) => {
    setStep(Math.max(0, Math.min(next, STEPS.length - 1)))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await api('/profile/submit', { method: 'POST', body: {} })
      toast.success('Profile submitted for approval!')
      await loadProfile()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const editSection = (section) => {
    const sectionIndex = STEPS.findIndex((item) => item.key === section)
    if (sectionIndex < 0 || sectionIndex >= STEPS.length - 1) return
    setConfirmedSections((confirmed) => ({ ...confirmed, [section]: false }))
    setEditingSection(section)
    goTo(sectionIndex)
  }
  const updateDraft = (section, value) => {
    const nextDrafts = { ...drafts, [section]: value }
    setDrafts(nextDrafts)
    if (!profile?.userId) return
    try {
      localStorage.setItem(`mb_profile_draft_${profile.userId}`, JSON.stringify(nextDrafts))
    } catch {
      toast.error('Unable to save your form progress in this browser.')
    }
  }
  const continueFromStep = () => {
    if (editingSection === current.key && current.key === 'photos') {
      setEditingSection(null)
      goTo(STEPS.length - 1)
    } else if (current.saveable && !readOnly) {
      persistSection(current.key, drafts[current.key] || {})
    } else {
      goTo(step + 1)
    }
  }
  const allSectionsConfirmed = REVIEW_SECTION_KEYS.every((section) => confirmedSections[section])
  const reviewProfile = {
    ...profile,
    ...drafts,
    photos: profile.photos || [],
    contact: {
      ...profile.contact,
      ...drafts.contact,
      email: drafts.contact?.email || profile.contact?.email || user?.email || '',
    },
  }

  return (
    <div className="profile-page">
      {/* top bar: status + completion */}
      <div className="profile-topbar">
        {profile.status === 'approved' ? (
          <div className="profile-status-timeline">
            <ProfileTimeline
              status={profile.status}
              paymentStatus={profile.paymentStatus}
              paymentRequired={profile.paymentRequired}
              variant="compact"
              title={null}
            />
          </div>
        ) : (
          <>
            <div className="profile-topbar-row">
              <span className="profile-step-label">
                Step {step + 1} of {STEPS.length} — {current.title}
              </span>
              <span className={`status-chip status-chip--${profile.status}`}>
                {profile.status === 'draft' && 'Draft'}
                {profile.status === 'pending_approval' && 'Under review'}
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
          </>
        )}
      </div>

      {/* status banners */}
      {profile.status === 'rejected' && (
        <div className="profile-banner" data-role="reason">
          ❌ Your profile was rejected{profile.rejectionReason ? `: ${profile.rejectionReason}` : ''}
        </div>
      )}
      {readOnly && profile.status !== 'approved' && (
        <div className="profile-banner profile-banner--info">
          {STATUS_MESSAGES[profile.status]} The form is read-only until the admin approves it
          {' '}(or asks for changes).
        </div>
      )}
      {/* step content */}
      <div className="wizard-card">
        <h2 className="wizard-title">{current.title}</h2>
        {current.key === 'photos' && (
          <p className="wizard-sub">First photo you add becomes your profile photo.</p>
        )}
        {current.key === 'review' && (
          <p className="wizard-sub">Check every section, then submit.</p>
        )}

        {current.key === 'photos' ? (
          <StepPhotos profile={profile} onProfileReplace={replaceProfile} disabled={!!readOnly} />
        ) : current.key === 'review' ? (
          <StepReview
            profile={reviewProfile}
            completionPercent={percent}
            disabled={!!readOnly}
            submitting={saving}
            onSubmit={handleSubmit}
            onEditSection={editSection}
            confirmedSections={confirmedSections}
            onToggleSection={(section, checked) => setConfirmedSections((current) => ({
              ...current,
              [section]: checked,
            }))}
            allSectionsConfirmed={allSectionsConfirmed}
          />
        ) : (
          <current.Component
            value={drafts[current.key] || {}}
            onChange={(v) => updateDraft(current.key, v)}
            disabled={readOnly}
            onProfileReplace={replaceProfile}
            gender={profile?.basic?.gender}
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
                onClick={continueFromStep}
              >
                {saving
                  ? 'Saving…'
                  : editingSection === current.key
                    ? current.saveable ? 'Save & Return to Review' : 'Return to Review'
                    : current.saveable && !readOnly ? 'Save & Continue' : 'Continue'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
