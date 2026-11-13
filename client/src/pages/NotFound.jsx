import { Link } from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta.js'

export default function NotFound() {
  usePageMeta('Page not found', 'The page you are looking for does not exist.')

  return (
    <div className="notfound-page">
      <div className="notfound-card">
        <p className="notfound-code">404</p>
        <h1 className="notfound-title">Page not found</h1>
        <p className="notfound-sub">
          The page you are looking for does not exist or has moved.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-primary">Back to Home</Link>
          <Link to="/browse" className="btn btn-outline">Assigned matches</Link>
        </div>
      </div>
    </div>
  )
}
