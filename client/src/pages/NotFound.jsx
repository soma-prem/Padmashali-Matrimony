import { Link } from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta.js'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function NotFound() {
  const { t } = useLanguage()
  usePageMeta(t('Page not found'), t('The page you are looking for does not exist.'))

  return (
    <div className="notfound-page">
      <div className="notfound-card">
        <p className="notfound-code">404</p>
        <h1 className="notfound-title">{t('Page not found')}</h1>
        <p className="notfound-sub">
          {t('The page you are looking for does not exist or has moved.')}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-primary">{t('Back to Home')}</Link>
          <Link to="/browse" className="btn btn-outline">{t('Assigned matches')}</Link>
        </div>
      </div>
    </div>
  )
}
