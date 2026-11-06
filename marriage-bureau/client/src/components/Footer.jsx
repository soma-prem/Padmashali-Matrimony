import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-col footer-brand-col">
          <p className="footer-title">Padmashali Matrimony</p>
          <p className="footer-sub">
            Admin-verified community matchmaking for the Padmashali samaj and open to all.
            Traditional values — a modern, safe way to meet.
          </p>
        </div>

        <nav className="footer-col" aria-label="Explore">
          <p className="footer-heading">Explore</p>
          <Link to="/about">About the Padmashali samaj</Link>
          <Link to="/how-it-works">How it works</Link>
          <Link to="/contact">Contact us</Link>
          <Link to="/terms">Terms &amp; privacy</Link>
        </nav>

        <nav className="footer-col" aria-label="Get started">
          <p className="footer-heading">Get started</p>
          <Link to="/register">Register free</Link>
          <Link to="/login">Login</Link>
          <Link to="/browse">Browse profiles</Link>
        </nav>
      </div>

      <p className="footer-note">© {new Date().getFullYear()} Padmashali Samaj Matrimony. All rights reserved.</p>
    </footer>
  )
}
