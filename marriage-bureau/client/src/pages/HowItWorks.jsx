import { Link } from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta.js'

const STEPS = [
  {
    no: '1',
    title: 'Create your profile',
    text: 'Register with your email, then complete the 10-step profile — basic details, community (caste/kulam/gotra), horoscope with optional kundli image, education & career, family, lifestyle & location, photos (up to 6), partner preferences and contact details.',
    note: 'Contact details stay private — only the admin and your approved match can ever see them.',
  },
  {
    no: '2',
    title: 'Admin verification',
    text: 'Submit your profile for approval when it is at least 80% complete with at least one photo. Our admin verifies it — approving it or telling you exactly what to fix.',
    note: 'You get an in-website notification at every step. No emails, no SMS.',
  },
  {
    no: '3',
    title: 'Browse matches',
    text: 'Once approved, you can browse all other approved profiles of the opposite gender. Filter by age, education, location, nakshatra or gotra. Full profiles — but never contact details.',
    note: 'Verified photos, profession, family details and preferences are visible.',
  },
  {
    no: '4',
    title: 'Connect through admin',
    text: 'Send an interest request to the profile you like (up to 5 pending at a time). The admin personally reviews it. When approved, BOTH families become connected and see each other\u2019s contact details.',
    note: 'This final step is what has always made samaj matchmaking trustworthy — the elders in the middle.',
  },
]

export default function HowItWorks() {
  usePageMeta(
    'How it works',
    'Create profile → admin verification → browse matches → connect through the admin. Contact details unlock only for approved connections.'
  )

  return (
    <div className="public-page">
      <h1 className="public-title">How it works</h1>
      <p className="section-sub">
        A safe, admin-assisted process from start to finish — the way community matrimony has
        always worked, brought online.
      </p>

      <div className="steps how-vert">
        {STEPS.map((s) => (
          <div className="step-card" key={s.no}>
            <span className="step-number">{s.no}</span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
            <p className="step-note">{s.note}</p>
          </div>
        ))}
      </div>

      <div className="hero-actions" style={{ justifyContent: 'center', marginTop: 20 }}>
        <Link to="/register" className="btn btn-primary btn-lg">Register Free</Link>
        <Link to="/contact" className="btn btn-outline btn-lg">Contact the admin team</Link>
      </div>
    </div>
  )
}
