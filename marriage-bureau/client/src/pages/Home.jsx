import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
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

  usePageMeta(
    'Padmashali Samaj Matrimony — traditional matchmaking for the community',
    'Create a verified profile, browse approved matches of the opposite gender and connect through our admin-assisted matchmaking.'
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
            <h1 id="home-heading" className="hero-title">
              Where meaningful <span className="hero-accent">beginnings</span> find you.
            </h1>
            <p className="hero-sub">
              Meet someone who shares your values, your roots and your hopes for the
              future. A trusted space for families to discover a truly compatible match.
            </p>
            {!user && (
              <div className="hero-actions">
                <Link to="/login" className="btn btn-outline">Login</Link>
                <Link to="/register" className="btn btn-primary">
                  Register
                </Link>
              </div>
            )}
          </div>
          <div className="hero-visual" role="region" aria-label="Wedding photo slideshow" aria-roledescription="carousel">
            {HERO_IMAGES.map((image, index) => (
              <img
                key={image.src}
                className={`hero-slide${index === activeImage ? ' is-active' : ''}`}
                src={image.src}
                alt={index === activeImage ? image.alt : ''}
                aria-hidden={index !== activeImage}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
              />
            ))}
            <div className="hero-photo-note">
              <strong>Rooted in tradition. Open to love.</strong>
              <span>A more personal way to meet your match</span>
            </div>
            <div className="hero-slide-controls" aria-label="Choose a wedding photo">
              {HERO_IMAGES.map((image, index) => (
                <button
                  key={image.src}
                  type="button"
                  className={`hero-slide-dot${index === activeImage ? ' is-active' : ''}`}
                  aria-label={`Show photo ${index + 1} of ${HERO_IMAGES.length}`}
                  aria-pressed={index === activeImage}
                  onClick={() => setActiveImage(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
      <div className="home-mobile-pages">
        <section aria-label="How it works">
          <HowItWorks embedded />
        </section>
        <section aria-label="Contact us">
          <ContactUs embedded />
        </section>
      </div>
    </div>
  )
}
