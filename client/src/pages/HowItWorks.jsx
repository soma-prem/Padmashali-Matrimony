import { Link } from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta.js'

const STEPS = [
  {
    no: '01',
    title: 'Create your profile',
    text: 'Register and fill in your details, community, horoscope, career, family information and photos.',
    note: 'Your contact details are shared only with your assigned match.',
  },
  {
    no: '02',
    title: 'Admin verification',
    text: 'Submit your profile once it is at least 70% complete and has a photo. Our team reviews it and lets you know the result.',
    note: 'Updates are available through in-website notifications.',
  },
  {
    no: '03',
    title: 'Submit your payment',
    text: 'The admin sends payment instructions after approving your profile. Submit your payment details for verification.',
    note: 'Payment must be verified before an assignment can be made.',
  },
  {
    no: '04',
    title: 'Review your match',
    text: 'The admin assigns one approved, paid profile of the opposite gender for you to review.',
    note: 'See only your assigned profile and its contact details in the Assigned matches tab.',
  },
]

export default function HowItWorks({ embedded = false }) {
  usePageMeta(
    'How it works',
    'Complete your profile, get approved, submit payment for admin verification, then receive an admin-assigned match with contact details.',
    !embedded
  )

  return (
    <div className="public-page how-page">
      <header className="how-page-heading">
        <h1 className="public-title">How it works</h1>
        <p className="section-sub">
          A simple, family-friendly process with guidance and privacy at every step.
        </p>
      </header>

      <div className="steps how-steps">
        {STEPS.map((s) => (
          <div className="step-card" key={s.no}>
            <span className="step-number">{s.no}</span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
            <p className="step-note">{s.note}</p>
          </div>
        ))}
      </div>

      <div className="hero-actions how-actions">
        <Link to="/register" className="btn btn-primary btn-lg">Register</Link>
        <Link to="/contact" className="btn btn-outline btn-lg">Contact the admin team</Link>
      </div>
    </div>
  )
}
