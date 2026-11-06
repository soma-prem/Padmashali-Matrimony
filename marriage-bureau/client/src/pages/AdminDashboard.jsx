import { useAuth } from '../context/AuthContext.jsx'

export default function AdminDashboard() {
  const { user } = useAuth()

  return (
    <div className="dashboard-page">
      <div className="dashboard-card admin-card">
        <h1 className="dashboard-title">Admin Dashboard</h1>
        <p className="dashboard-sub">Logged in as {user.name} ({user.email})</p>

        <div className="admin-placeholder">
          <p>
            Profile approvals, interest-request reviews and user management will be built in
            Stage&nbsp;3 and Stage&nbsp;4.
          </p>
        </div>
      </div>
    </div>
  )
}
