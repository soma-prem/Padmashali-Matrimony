import React from 'react'

/**
 * Computes the 4-stage timeline status from profile and payment activity.
 * Stages:
 *  1. Profile submitted
 *  2. Admin approved
 *  3. Payment completed
 *  4. Admin verified
 */
export function getTimelineSteps(status = 'draft', paymentStatus = null, paymentRequired = false) {
  // Step 1: Profile submitted
  let step1State = 'pending'
  let step1Desc = 'Draft in progress'
  if (['pending_approval', 'approved'].includes(status)) {
    step1State = 'completed'
    step1Desc = 'Profile submitted'
  } else if (status === 'rejected') {
    step1State = 'rejected'
    step1Desc = 'Changes requested'
  }

  // Step 2: Admin approved
  let step2State = 'pending'
  let step2Desc = 'Awaiting review'
  if (status === 'approved') {
    step2State = 'completed'
    step2Desc = 'Profile approved'
  } else if (status === 'pending_approval') {
    step2State = 'in_progress'
    step2Desc = 'Under review by admin'
  } else if (status === 'rejected') {
    step2State = 'rejected'
    step2Desc = 'Review not approved'
  }

  // Step 3: Payment completed
  let step3State = 'pending'
  let step3Desc = 'Pending approval'
  const isFullyAccepted = status === 'approved' &&
    paymentStatus === 'verified' &&
    !paymentRequired
  if (isFullyAccepted) {
    step3State = 'completed'
    step3Desc = 'Payment completed'
  } else if (paymentStatus === 'submitted') {
    step3State = 'completed'
    step3Desc = 'Payment submitted'
  } else if (paymentStatus === 'rejected') {
    step3State = 'rejected'
    step3Desc = 'Payment needs correction'
  } else if (paymentStatus === 'requested') {
    step3State = 'in_progress'
    step3Desc = 'Payment requested — pay now'
  } else if (status === 'approved') {
    step3State = 'in_progress'
    step3Desc = 'Awaiting payment request'
  }

  // Step 4: Admin verified
  let step4State = 'pending'
  let step4Desc = 'Awaiting payment submission'
  if (isFullyAccepted) {
    step4State = 'completed'
    step4Desc = 'Payment verified by admin'
  } else if (paymentStatus === 'submitted') {
    step4State = 'in_progress'
    step4Desc = 'Awaiting admin verification'
  } else if (paymentStatus === 'rejected') {
    step4State = 'rejected'
    step4Desc = 'Payment rejected by admin'
  }

  return [
    { id: 1, key: 'submitted', title: 'Profile submitted', state: step1State, desc: step1Desc },
    { id: 2, key: 'approved', title: 'Admin approved', state: step2State, desc: step2Desc },
    { id: 3, key: 'payment', title: 'Payment completed', state: step3State, desc: step3Desc },
    { id: 4, key: 'verified', title: 'Admin verified', state: step4State, desc: step4Desc },
  ]
}

function StatusIcon({ state }) {
  if (state === 'completed') return <span className="pt-icon pt-icon--check" aria-label="Completed">✓</span>
  if (state === 'in_progress') return <span className="pt-icon pt-icon--progress" aria-label="In progress">⏳</span>
  if (state === 'rejected') return <span className="pt-icon pt-icon--reject" aria-label="Rejected">✕</span>
  return <span className="pt-icon pt-icon--pending" aria-label="Pending">○</span>
}

export default function ProfileTimeline({
  status = 'draft',
  paymentStatus = null,
  paymentRequired = false,
  variant = 'full', // 'full' | 'compact'
  title = 'Profile Progress Timeline',
}) {
  const steps = getTimelineSteps(status, paymentStatus, paymentRequired)

  if (variant === 'compact') {
    return (
      <div className="pt-compact" aria-label="Profile progress status">
        {steps.map((s, idx) => (
          <React.Fragment key={s.key}>
            <div className={`pt-compact-step pt-step--${s.state}`} title={`${s.title}: ${s.desc}`}>
              <StatusIcon state={s.state} />
              <span className="pt-compact-title">{s.title}</span>
            </div>
            {idx < steps.length - 1 && <span className="pt-compact-arrow" aria-hidden="true">→</span>}
          </React.Fragment>
        ))}
      </div>
    )
  }

  return (
    <div className="pt-container">
      {title && <h3 className="pt-heading">{title}</h3>}
      <div className="pt-track">
        {steps.map((s, idx) => (
          <div key={s.key} className={`pt-step pt-step--${s.state}`}>
            <div className="pt-node">
              <div className="pt-node-circle">
                <StatusIcon state={s.state} />
              </div>
              {idx < steps.length - 1 && <div className="pt-line" aria-hidden="true" />}
            </div>
            <div className="pt-info">
              <span className="pt-step-num">Step {s.id}</span>
              <strong className="pt-step-title">{s.title}</strong>
              <span className="pt-step-desc">{s.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
