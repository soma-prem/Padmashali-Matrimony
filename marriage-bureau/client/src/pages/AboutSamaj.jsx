import { Link } from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta.js'

export default function AboutSamaj() {
  usePageMeta(
    'About the Padmashali Samaj',
    'The Padmashali community: handloom weaving heritage, kulam traditions, gotra and nakshatra in matchmaking.'
  )

  return (
    <div className="public-page">
      <h1 className="public-title">About the Padmashali Samaj</h1>

      <div className="community-card">
        <h2>Weavers by heritage</h2>
        <p>
          The Padmashali community is one of South India's well-known handloom-weaving samajs,
          with generations of weavers producing saris, dress materials and traditional cloth.
          The name itself carries pride in the craft — the community's identity is deeply
          linked to the loom, patience, skill and devotion.
        </p>

        <h2>Kulam traditions</h2>
        <p>
          Marriage within the samaj traditionally respects <strong>kulam</strong> groupings —
          commonly the 3 kulam, 5 kulam and 7 kulam groupings, along with sub-groups such as
          Padmasale and Jandra. Our profile form includes these options so families can
          identify matches that respect their tradition.
        </p>

        <h2>Horoscope and gotra</h2>
        <p>
          Elders consider <strong>gotra</strong>, <strong>rashi</strong> and
          <strong> nakshatra</strong> before agreeing to a match. Every profile on this
          website includes these details, and this is why our admin reviews profiles and
          match requests personally — so that both families have the information they need.
        </p>

        <h2>Open to other communities too</h2>
        <p>
          Although built for the Padmashali samaj, families from other communities are
          welcome to register. Everyone goes through the same verification and
          admin-assisted connection process.
        </p>
      </div>

      <div className="hero-actions" style={{ justifyContent: 'center', marginTop: 20 }}>
        <Link to="/register" className="btn btn-primary btn-lg">Register Free</Link>
        <Link to="/how-it-works" className="btn btn-outline btn-lg">How it works</Link>
      </div>
    </div>
  )
}
