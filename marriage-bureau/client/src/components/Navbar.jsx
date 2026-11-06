import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api, toast } from '../api/api.js'
import NotificationBell from './NotificationBell.jsx'

const PUBLIC_LINKS = [
  { to: '/', label: 'Home', icon: '⌂', end: true },
  { to: '/how-it-works', label: 'How it works', icon: '◇' },
  { to: '/contact', label: 'Contact us', icon: '✉' },
]

const USER_LINKS = [
  { to: '/profile', label: 'My profile', icon: '♙' },
  { to: '/browse', label: 'Discover matches', icon: '♡' },
  { to: '/requests', label: 'My requests', icon: '↗' },
  { to: '/connections', label: 'Connections', icon: '♧' },
]

const ADMIN_LINKS = [
  { to: '/admin', label: 'Dashboard', icon: '▦', end: true },
  { to: '/admin/profiles?status=pending_approval', label: 'Pending profiles', icon: '◷', end: true, countKey: 'pendingProfiles' },
  { to: '/admin/profiles', label: 'All profiles', icon: '♙', countKey: 'totalProfiles' },
  { to: '/admin/requests', label: 'Requests', icon: '↗', countKey: 'pendingRequests' },
  { to: '/admin/connections', label: 'Connections', icon: '♧', countKey: 'totalConnections' },
  { to: '/admin/messages', label: 'Contact messages', icon: '✉', countKey: 'openMessages' },
]

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [adminCounts, setAdminCounts] = useState(null)
  const [openMessagesCount, setOpenMessagesCount] = useState(null)

  const close = () => setOpen(false)
  const isPublicHome = !user && !isAdmin && location.pathname === '/'
  const links = isAdmin ? ADMIN_LINKS : user ? USER_LINKS : PUBLIC_LINKS
  const sectionLabel = isAdmin ? 'Administration' : user ? 'Your space' : 'Explore'

  useEffect(() => {
    if (!isAdmin) {
      setAdminCounts(null)
      setOpenMessagesCount(null)
      return undefined
    }

    let cancelled = false
    api('/admin/stats')
      .then((response) => {
        if (!cancelled) setAdminCounts(response.data)
      })
      .catch((error) => {
        if (!cancelled) toast.error(`Could not load sidebar counts: ${error.message}`)
      })
    api('/admin/messages?filter=open')
      .then((response) => {
        if (!cancelled) setOpenMessagesCount(response.data.count)
      })
      .catch((error) => {
        if (!cancelled) toast.error(`Could not load contact message count: ${error.message}`)
      })

    return () => { cancelled = true }
  }, [isAdmin, location.pathname, location.search])

  const handleLogout = () => {
    logout()
    close()
    navigate('/')
  }

  return (
    <>
      {!isPublicHome && <div className="sidebar-mobile-bar">
        <button
          type="button"
          className="sidebar-toggle"
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={open}
          aria-controls="app-sidebar"
          onClick={() => setOpen((isOpen) => !isOpen)}
        >
          <span aria-hidden="true">{open ? '×' : '☰'}</span>
        </button>
        <Link to="/" className="sidebar-mobile-brand" onClick={close} aria-label="Padmashali Matrimony home">
          <img src="/logo.png" alt="Padmashali Matrimony" />
        </Link>
      </div>}

      {!isPublicHome && open && <button type="button" className="sidebar-scrim" aria-label="Close navigation menu" onClick={close} />}

      <aside id="app-sidebar" className={`app-sidebar${open ? ' is-open' : ''}${isPublicHome ? ' is-public-home' : ''}`}>
        <Link to="/" className="navbar-brand" onClick={close}>
          <img src="/logo.png" alt="Padmashali Matrimony" />
        </Link>

        <nav className="sidebar-navigation" aria-label="Main navigation">
          <p className="sidebar-section-label">{sectionLabel}</p>
          {links.map(({ to, label, icon, end, countKey }) => {
            const count = countKey === 'openMessages'
              ? openMessagesCount
              : adminCounts?.[countKey]
            const isPendingProfiles = to.includes('status=pending_approval')
            const isAllProfiles = to === '/admin/profiles'
            const isAdminProfiles = location.pathname === '/admin/profiles'
            const exactMatch = isPendingProfiles
              ? location.pathname === '/admin/profiles' && new URLSearchParams(location.search).get('status') === 'pending_approval'
              : isAllProfiles
                ? isAdminProfiles && new URLSearchParams(location.search).get('status') !== 'pending_approval'
                : undefined

            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `nav-link${(exactMatch ?? isActive) ? ' active' : ''}`}
                onClick={close}
              >
                <span className="sidebar-link-icon" aria-hidden="true">{icon}</span>
                <span>{label}</span>
                {countKey && count !== null && count !== undefined && (
                  <span className="sidebar-count" aria-label={`${count} records`}>
                    {count}
                  </span>
                )}
              </NavLink>
            )
          })}
          {user && !isAdmin && <NotificationBell onClick={close} />}
        </nav>

        {user && (
          <div className="sidebar-account">
            <div className="sidebar-user-avatar" aria-hidden="true">
              {(user.name || 'U').slice(0, 1).toUpperCase()}
            </div>
            <div className="sidebar-user-details">
              <strong>{user.name || 'Your account'}</strong>
              <span>{isAdmin ? 'Administrator' : 'Member'}</span>
            </div>
            <button type="button" className="sidebar-logout" onClick={handleLogout} aria-label="Log out" title="Log out">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M10 17l5-5-5-5" />
                <path d="M15 12H3" />
                <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
              </svg>
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
