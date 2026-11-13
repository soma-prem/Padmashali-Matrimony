import { Link } from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta.js'
import { useLanguage } from '../context/LanguageContext.jsx'

const STEPS = [
  {
    no: '01',
    title: 'Create your profile',
    text: 'Register and fill in your details, community, horoscope, career, family information and photos.',
    note: 'Your contact details are shared only with profiles the admin assigns to you.',
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
    text: 'The admin may assign one or more approved, paid profiles of the opposite gender for you to review.',
    note: 'See only your assigned profiles and their contact details in the Assigned matches tab.',
  },
]

export default function HowItWorks({ embedded = false }) {
  const { t } = useLanguage()
  usePageMeta(
    t('How it works'),
    t('Complete your profile, get approved, submit payment for admin verification, then receive an admin-assigned match with contact details.'),
    !embedded
  )

  return (
    <div className="public-page how-page">
      <header className="how-page-heading">
        <h1 className="public-title">{t('How it works')}</h1>
        <p className="section-sub">
          {t('A simple, family-friendly process with guidance and privacy at every step.')}
        </p>
      </header>

      <div className="steps how-steps">
        {STEPS.map((s) => (
          <div className="step-card" key={s.no}>
            <span className="step-number">{s.no}</span>
            <h3>{t(s.title)}</h3>
            <p>{t(s.text)}</p>
            <p className="step-note">{t(s.note)}</p>
          </div>
        ))}
      </div>

      <div className="hero-actions how-actions">
        <Link to="/register" className="btn btn-primary btn-lg">{t('Register')}</Link>
        <Link to="/contact" className="btn btn-outline btn-lg">{t('Contact the admin team')}</Link>
      </div>
    </div>
  )
}
