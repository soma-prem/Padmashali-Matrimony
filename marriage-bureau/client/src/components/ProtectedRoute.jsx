import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * Guards routes behind authentication (and optionally a role).
 *
 *   <ProtectedRoute><UserDashboard /></ProtectedRoute>
 *   <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
 *
 * - Not logged in  -> redirect to /login (remembering where the user wanted to go)
 * - Logged in but wrong role -> redirect to home
 * - Still checking /auth/me on first load -> render nothing briefly
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="page-loading">Loading…</div>
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}
