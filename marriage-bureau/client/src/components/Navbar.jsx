import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import NotificationBell from './NotificationBell.jsx'

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false) // hamburger menu

  const close = () => setOpen(false)

  const handleLogout = () => {
    logout()
    close()
    navigate('/')
  }

  // links depend on who is viewing: visitor / user / admin
  const publicLinks = (
    <>
      <NavLink to="/" className="nav-link" end onClick={close}>Home</NavLink>
      <NavLink to="/about" className="nav-link" onClick={close}>About Samaj</NavLink>
      <NavLink to="/how-it-works" className="nav-link" onClick={close}>How it works</NavLink>
      <NavLink to="/contact" className="nav-link" onClick={close}>Contact</NavLink>
    </>
  )

  const userLinks = (
    <>
      <NavLink to="/" className="nav-link" end onClick={close}>Home</NavLink>
      <NavLink to="/dashboard" className="nav-link" onClick={close}>Dashboard</NavLink>
      <NavLink to="/profile" className="nav-link" onClick={close}>Profile</NavLink>
      <NavLink to="/browse" className="nav-link" onClick={close}>Browse</NavLink>
      <NavLink to="/requests" className="nav-link" onClick={close}>Requests</NavLink>
      <NavLink to="/connections" className="nav-link" onClick={close}>Connections</NavLink>
    </>
  )

  const adminLinks = (
    <>
      <NavLink to="/" className="nav-link" end onClick={close}>Home</NavLink>
      <NavLink to="/admin" className="nav-link" onClick={close}>Admin Panel</NavLink>
    </>
  )

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={close}>
          <span className="brand-heart" aria-hidden="true">♥</span>
          <span className="brand-text">
            Padmashali <b>Matrimony</b>
          </span>
        </Link>

        {/* mobile hamburger */}
        <button
          type="button"
          className="nav-burger"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span aria-hidden="true">{open ? '✕' : '☰'}</span>
        </button>

        <nav className={`navbar-links ${open ? 'is-open' : ''}`}>
          {!user && publicLinks}
          {user && !isAdmin && (
            <>
              {userLinks}
              <NotificationBell onClick={close} />
            </>
          )}
          {user && isAdmin && adminLinks}

          {user ? (
            <button type="button" className="btn btn-outline navbar-logout" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <>
              <NavLink to="/login" className="nav-link" onClick={close}>Login</NavLink>
              <NavLink to="/register" className="btn btn-primary nav-register" onClick={close}>
                Register
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
