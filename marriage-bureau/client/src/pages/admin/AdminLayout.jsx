import { Link, Outlet, useLocation } from 'react-router-dom'

/**
 * Admin area shell — top menu + nested pages (see /admin routes in App.jsx).
 */
const LINKS = [
  { to: '/admin', label: 'Dashboard', match: (p) => p === '/admin' },
  { to: '/admin/profiles?status=pending_approval', label: 'Pending Profiles', match: (p, s) => p === '/admin/profiles' && s === 'pending_approval' },
  { to: '/admin/profiles', label: 'All Profiles', match: (p, s) => p === '/admin/profiles' && s !== 'pending_approval' },
  { to: '/admin/requests', label: 'Requests', match: (p) => p === '/admin/requests' },
  { to: '/admin/connections', label: 'Connections', match: (p) => p === '/admin/connections' },
  { to: '/admin/messages', label: 'Contact Messages', match: (p) => p === '/admin/messages' },
]

export default function AdminLayout() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)

  return (
    <div className="admin-page">
      <nav className="admin-menu" aria-label="Admin menu">
        {LINKS.map((link) => {
          const active = link.match(location.pathname, params.get('status'))
          return (
            <Link
              key={link.label}
              to={link.to}
              className={active ? 'active' : ''}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>

      <Outlet />
    </div>
  )
}
