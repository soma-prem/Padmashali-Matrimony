import { useAdminStats } from '../../context/AdminStatsContext.jsx'
import { useLanguage } from '../../context/LanguageContext.jsx'

export default function AdminDashboardPage() {
  const { stats, error, loading } = useAdminStats()
  const { t } = useLanguage()

  return (
    <div>
      <h1 className="dashboard-title" style={{ marginBottom: 16 }}>{t('Admin Dashboard')}</h1>

      {loading && <div className="page-loading">{t('Loading stats…')}</div>}
      {error && <p className="form-error">{error}</p>}

      {stats && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="num">{stats.totalUsers}</div>
            <div className="lbl">{t('Total users')}</div>
          </div>
          <div className="stat-card">
            <div className="num">{stats.uniqueVisitors}</div>
            <div className="lbl">{t('Unique visitors')}</div>
          </div>
          <div className="stat-card">
            <div className="num">{stats.pendingProfiles}</div>
            <div className="lbl">{t('Pending profiles')}</div>
          </div>
          <div className="stat-card">
            <div className="num">{stats.approvedProfiles}</div>
            <div className="lbl">{t('Approved profiles')}</div>
          </div>
        </div>
      )}
    </div>
  )
}
