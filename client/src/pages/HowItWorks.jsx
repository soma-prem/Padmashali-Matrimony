import { Link } from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta.js'

const STEPS = [
  {
    no: '01',
    title: 'Create your profile',
    text: 'Register and fill in your details, community, horoscope, career, family information and photos.',
    note: 'Your contact details stay private until a connection is approved.',
  },
  {
    no: '02',
    title: 'Admin verification',
    text: 'Submit your profile once it is at least 70% complete and has a photo. Our team reviews it and lets you know the result.',
    note: 'Updates are available through in-website notifications.',
  },
  {
    no: '03',
    title: 'Browse matches',
    text: 'After approval, explore approved profiles and filter by age, education, location, nakshatra or gotra.',
    note: 'Browse profile details without exposing private contact information.',
  },
  {
    no: '04',
    title: 'Connect through admin',
    text: 'Send an interest request. Our admin reviews it and helps both families make an introduction.',
    note: 'Contact details are shared only after the connection is approved.',
  },
]

export default function HowItWorks({ embedded = false }) {
  usePageMeta(
    'How it works',
    'Create profile → admin verification → browse matches → connect through the admin. Contact details unlock only for approved connections.',
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
