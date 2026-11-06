import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { api } from '../api/api.js'

/**
 * Sidebar notifications link — polls unread count every 30s (user role only).
 * Pass onClick to close the mobile sidebar after navigation.
 */
export default function NotificationBell({ onClick }) {
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let cancelled = false
    const fetchCount = async () => {
      try {
        const data = await api('/notifications/unread-count')
        if (!cancelled) setUnread(data.data.unread ?? 0)
      } catch {
        // offline / backend down — keep last count silently
      }
    }

    fetchCount()
    const timer = setInterval(fetchCount, 30000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  return (
    <NavLink
      to="/notifications"
      className={({ isActive }) => `notif-bell${isActive ? ' active' : ''}`}
      onClick={onClick}
      aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
    >
      <span aria-hidden="true">♢</span>
      <span>Notifications</span>
      {unread > 0 && <span className="bell-badge">{unread > 99 ? '99+' : unread}</span>}
    </NavLink>
  )
}
