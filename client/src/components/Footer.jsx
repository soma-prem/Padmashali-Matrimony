import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function Footer() {
  const { t } = useLanguage()
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-col footer-brand-col">
          <p className="footer-title">Padmashali Matrimony</p>
          <p className="footer-sub">
            {t('Admin-verified community matchmaking for the Padmashali samaj and open to all. Traditional values — a modern, safe way to meet.')}
          </p>
        </div>

        <nav className="footer-col" aria-label="Explore">
          <p className="footer-heading">{t('Explore')}</p>
          <Link to="/how-it-works">{t('How it works')}</Link>
          <Link to="/contact">{t('Contact us')}</Link>
          <Link to="/terms">{t('Terms & privacy')}</Link>
        </nav>

        <nav className="footer-col" aria-label="Get started">
          <p className="footer-heading">{t('Get started')}</p>
          <Link to="/register">{t('Register free')}</Link>
          <Link to="/login">{t('Login')}</Link>
          <Link to="/browse">{t('Assigned matches')}</Link>
        </nav>
      </div>

      <p className="footer-note">© {new Date().getFullYear()} Padmashali Samaj Matrimony. {t('All rights reserved.')}</p>
    </footer>
  )
}
