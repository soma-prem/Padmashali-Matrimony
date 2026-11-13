import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import LanguageToggle from '../components/LanguageToggle.jsx'
import { usePageMeta } from '../utils/usePageMeta.js'
import HowItWorks from './HowItWorks.jsx'
import ContactUs from './ContactUs.jsx'

const HERO_IMAGES = [
  {
    src: '/slides/1.jpg',
    alt: 'Wedding slideshow photo 1',
  },
  {
    src: '/slides/2.jpg',
    alt: 'Wedding slideshow photo 2',
  },
  {
    src: '/slides/3.jpg',
    alt: 'Wedding slideshow photo 3',
  },
  {
    src: '/slides/4.jpg',
    alt: 'Wedding slideshow photo 4',
  },
  {
    src: '/slides/5.jpg',
    alt: 'Wedding slideshow photo 5',
  },
]

export default function Home() {
  const [activeImage, setActiveImage] = useState(0)
  const { user } = useAuth()
  const { t } = useLanguage()

  usePageMeta(
    t('Padmashali Samaj Matrimony — traditional matchmaking for the community'),
    t('Complete your profile, get approved and receive a manually assigned match with contact details through our admin-managed matchmaking.')
  )

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % HERO_IMAGES.length)
    }, 2000)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="home-page">
      <section className="hero" aria-labelledby="home-heading">
        <div className="hero-card">
          <div className="hero-copy">
            <div className="hero-language-toggle"><LanguageToggle /></div>
            <h1 id="home-heading" className="hero-title">
              {t('Where meaningful')} <span className="hero-accent">{t('beginnings')}</span> {t('find you.')}
            </h1>
            <p className="hero-sub">
              {t('Meet someone who shares your values, your roots and your hopes for the future. A trusted space for families to discover a truly compatible match.')}
            </p>
            {!user && (
              <div className="hero-actions">
                <Link to="/login" className="btn btn-outline">{t('Login')}</Link>
                <Link to="/register" className="btn btn-primary">
                  {t('Register')}
                </Link>
              </div>
            )}
          </div>
          <div className="hero-visual" role="region" aria-label={t('Wedding photo slideshow')} aria-roledescription="carousel">
            {HERO_IMAGES.map((image, index) => (
              <img
                key={image.src}
                className={`hero-slide${index === activeImage ? ' is-active' : ''}`}
                src={image.src}
                alt={index === activeImage ? t(image.alt) : ''}
                aria-hidden={index !== activeImage}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
              />
            ))}
            <div className="hero-photo-note">
              <strong>{t('Rooted in tradition. Open to love.')}</strong>
              <span>{t('A more personal way to meet your match')}</span>
            </div>
            <div className="hero-slide-controls" aria-label={t('Choose a wedding photo')}>
              {HERO_IMAGES.map((image, index) => (
                <button
                  key={image.src}
                  type="button"
                  className={`hero-slide-dot${index === activeImage ? ' is-active' : ''}`}
                  aria-label={`${t('Show photo')} ${index + 1} ${t('of')} ${HERO_IMAGES.length}`}
                  aria-pressed={index === activeImage}
                  onClick={() => setActiveImage(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
      <div className="home-mobile-pages">
        <section aria-label={t('How it works')}>
          <HowItWorks embedded />
        </section>
        <section aria-label={t('Contact us')}>
          <ContactUs embedded />
        </section>
      </div>
    </div>
  )
}
