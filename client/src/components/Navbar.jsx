import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api, toast } from '../api/api.js'
import NotificationBell from './NotificationBell.jsx'
import { useAdminStats } from '../context/AdminStatsContext.jsx'

const PUBLIC_LINKS = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/how-it-works', label: 'How it works', icon: 'how-it-works' },
  { to: '/contact', label: 'Contact us', icon: 'contact' },
]

const PUBLIC_ICON_PATHS = {
  home: <><path d="m3.5 10 8.5-7 8.5 7" /><path d="M5.5 9v11h13V9M9 20v-6h6v6" /></>,
  'how-it-works': <path d="m12 3 9 9-9 9-9-9 9-9Z" />,
  contact: <><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="m4 7 8 6 8-6" /></>,
}

const USER_LINKS = [
  { to: '/profile', label: 'My profile', icon: '♙' },
  { to: '/browse', label: 'Assigned matches', icon: '♡', requiresApproval: true },
  { to: '/payment', label: 'Payment details', icon: '₹', requiresApproval: true },
]

const ADMIN_LINKS = [
  { to: '/admin', label: 'Dashboard', icon: '/logos/dashboard.png', end: true },
  { to: '/admin/profiles', label: 'Profiles', icon: '/logos/profile.jpg', countKey: 'pendingProfiles' },
  { to: '/admin/assign-users', label: 'Assign users', icon: '↔' },
  { to: '/admin/messages', label: 'Contact messages', icon: '/logos/contact.png', countKey: 'openMessages' },
  { to: '/admin/payments', label: 'Payments', icon: '/logos/payment.png', countKey: 'pendingPayments' },
]

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [openMessagesCount, setOpenMessagesCount] = useState(null)
  const { stats: adminCounts } = useAdminStats()
  const [profileApproved, setProfileApproved] = useState(false)
  const [accessChecked, setAccessChecked] = useState(false)

  const close = () => setOpen(false)
  const isPublicHome = !user && !isAdmin && location.pathname === '/'
  const links = isAdmin ? ADMIN_LINKS : user ? USER_LINKS : PUBLIC_LINKS
  const sectionLabel = isAdmin ? 'Administration' : user ? 'Your space' : 'Explore'

  useEffect(() => {
    if (!user || isAdmin) {
      setProfileApproved(false)
      setAccessChecked(false)
      return undefined
    }

    let cancelled = false
    setAccessChecked(false)
    api('/profile/me')
      .then((response) => {
        if (!cancelled) {
          const profile = response.data.profile
          setProfileApproved(profile.status === 'approved')
          setAccessChecked(true)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setAccessChecked(true)
          toast.error(`Could not check your profile access: ${error.message}`)
        }
      })
    return () => { cancelled = true }
  }, [isAdmin, user?.id, location.pathname])

  useEffect(() => {
    if (!isAdmin) {
      setOpenMessagesCount(null)
      return undefined
    }

    let cancelled = false
    api('/admin/messages?filter=open')
      .then((response) => {
        if (!cancelled) setOpenMessagesCount(response.data.count)
      })
      .catch((error) => {
        if (!cancelled) toast.error(`Could not load contact message count: ${error.message}`)
      })

    return () => { cancelled = true }
  }, [isAdmin, user?.id])

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
          {links.map(({ to, label, icon, end, countKey, requiresApproval }) => {
            const disabled = !isAdmin && requiresApproval && accessChecked && !profileApproved
            const pendingCheck = !isAdmin && requiresApproval && !accessChecked
            const count = countKey === 'openMessages'
              ? openMessagesCount
              : adminCounts?.[countKey]
            const isImageIcon = typeof icon === 'string' && /\.(png|jpe?g|svg|webp|gif)$/i.test(icon)
            const iconMarkup = isImageIcon
              ? <img src={icon} alt="" className="sidebar-link-icon sidebar-link-image" aria-hidden="true" />
              : PUBLIC_ICON_PATHS[icon]
                ? <svg className="sidebar-link-icon sidebar-link-svg" viewBox="0 0 24 24" aria-hidden="true">{PUBLIC_ICON_PATHS[icon]}</svg>
              : <span className="sidebar-link-icon" aria-hidden="true">{icon}</span>

            if (disabled || pendingCheck) {
              return (
                <span
                  key={to}
                  className="nav-link nav-link--disabled"
                  title="Get your profile verified by admin"
                  aria-label={`${label} — get your profile verified by admin`}
                >
                  {iconMarkup}
                  <span>{label}</span>
                  <span className="nav-link-tooltip">Get your profile verified by admin</span>
                </span>
              )
            }

            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                aria-label={label}
                onClick={close}
              >
                {iconMarkup}
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
