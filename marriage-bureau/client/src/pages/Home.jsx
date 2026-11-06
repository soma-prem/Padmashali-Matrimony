import { Link } from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta.js'

export default function Home() {
  usePageMeta(
    'Padmashali Samaj Matrimony — traditional matchmaking for the community',
    'Create a verified profile, browse approved matches of the opposite gender and connect through our admin-assisted matchmaking.'
  )

  return (
    <div className="home-page">
      {/* ---------------- hero ---------------- */}
      <section className="hero">
        <div className="hero-card">
          <span className="hero-motif" aria-hidden="true" />
          <p className="hero-eyebrow">Padmashali Samaj · Open to all communities</p>
          <h1 className="hero-title">
            Find your life partner <span className="hero-accent">within the community</span>
          </h1>
          <p className="hero-sub">
            A trusted matrimony platform for the Padmashali samaj and beyond — every profile
            is verified by our admin team, and contact details are shared only through
            approved connections.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg">Register Free</Link>
            <Link to="/login" className="btn btn-outline btn-lg">Login</Link>
          </div>
          <ul className="hero-points">
            <li>✅ Admin-verified profiles</li>
            <li>🔒 Contact details stay private</li>
            <li>🤝 Admin-assisted matchmaking</li>
          </ul>
        </div>
      </section>

      {/* ---------------- how it works ---------------- */}
      <section className="public-section">
        <h2 className="section-title">How it works</h2>
        <p className="section-sub">Four simple steps from registration to a happy match.</p>
        <div className="steps">
          <Step no="1" title="Create your profile" text="Register and fill your complete aristocratic profile — basic details, community, horoscope, education, family and photos." />
          <Step no="2" title="Admin verification" text="Our admin reviews every profile and approves it only when it is genuine. You will be notified right here." />
          <Step no="3" title="Browse matches" text="Once approved, browse other verified profiles of the opposite gender — without contact details." />
          <Step no="4" title="Connect through admin" text="Send an interest request. When the admin approves it, both families become connected and contact details unlock." />
        </div>
      </section>

      {/* ---------------- why us ---------------- */}
      <section className="public-section alt">
        <h2 className="section-title">Why our community platform</h2>
        <div className="feature-grid">
          <Feature icon="🛡️" title="Verified profiles" text="No random uploads — every profile is personally reviewed and approved by our admin team before anyone can see it." />
          <Feature icon="🔒" title="Privacy of contact details" text="Mobile, WhatsApp, email and address are never shown while browsing. They reach a family only after an approved connection." />
          <Feature icon="🤝" title="Admin-assisted matchmaking" text="Interest requests are personally reviewed by our admin, keeping the process dignified for both families." />
        </div>
      </section>

      {/* ---------------- community info ---------------- */}
      <section className="public-section community-info">
        <h2 className="section-title">About the Padmashali samaj</h2>
        <div className="community-card">
          <p>
            The <strong>Padmashali</strong> community is a traditional handloom-weaving samaj of
            South India, known for its craftsmanship, devotion and community spirit. Families
            share strong bonds through <em>kulam</em> traditions such as the 3, 5 and 7 kulam groups.
          </p>
          <p>
            This website exists to serve that tradition in a modern way — helping our boys and
            girls find compatible matches <strong>within the community</strong>, with the
            involvement and reassurance of elders through our admin-assisted process.
            Other communities are also warmly welcome.
          </p>
          <p>
            Gotra and nakshatra details are part of every profile, so families can check
            <strong> tradition-critical compatibility</strong> before a family connection is made.
          </p>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="cta-band">
        <h2 className="section-title">Ready to begin?</h2>
        <p className="section-sub">Registration is free. Complete your profile and our admin team will take care of the rest.</p>
        <div className="hero-actions">
          <Link to="/register" className="btn btn-primary btn-lg">Create my profile</Link>
          <Link to="/how-it-works" className="btn btn-outline btn-lg">See how it works</Link>
        </div>
      </section>
    </div>
  )
}

function Step({ no, title, text }) {
  return (
    <div className="step-card">
      <span className="step-number">{no}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}

function Feature({ icon, title, text }) {
  return (
    <div className="feature-card">
      <span className="feature-icon" aria-hidden="true">{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}
