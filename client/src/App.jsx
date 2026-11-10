import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './context/AuthContext.jsx'
import { AdminStatsProvider } from './context/AdminStatsContext.jsx'
import { api } from './api/api.js'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Navbar from './components/Navbar.jsx'
import Toaster from './components/Toaster.jsx'

import UserDashboard from './pages/UserDashboard.jsx'
import Profile from './pages/Profile.jsx'
import Notifications from './pages/Notifications.jsx'
import Browse from './pages/Browse.jsx'
import BrowseDetail from './pages/BrowseDetail.jsx'
import MyRequests from './pages/MyRequests.jsx'
import MyConnections from './pages/MyConnections.jsx'
import PaymentDetails from './pages/PaymentDetails.jsx'
import Home from './pages/Home.jsx'
import Register from './pages/Register.jsx'
import Login from './pages/Login.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import HowItWorks from './pages/HowItWorks.jsx'
import ContactUs from './pages/ContactUs.jsx'
import TermsPrivacy from './pages/TermsPrivacy.jsx'
import NotFound from './pages/NotFound.jsx'
import AdminLayout from './pages/admin/AdminLayout.jsx'
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx'
import AdminProfilesPage from './pages/admin/AdminProfilesPage.jsx'
import AdminProfileDetailPage from './pages/admin/AdminProfileDetailPage.jsx'
import AdminRequestsPage from './pages/admin/AdminRequestsPage.jsx'
import AdminConnectionsPage from './pages/admin/AdminConnectionsPage.jsx'
import AdminContactMessagesPage from './pages/admin/AdminContactMessagesPage.jsx'
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage.jsx'

function VisitorTracker() {
  useEffect(() => {
    let visitorId = localStorage.getItem('mb_visitor_id')
    if (!visitorId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitorId)) {
      visitorId = crypto.randomUUID()
      localStorage.setItem('mb_visitor_id', visitorId)
    }

    api('/visitors', { method: 'POST', body: { visitorId } })
      .catch((error) => console.error('Could not record unique visitor:', error))
  }, [])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminStatsProvider>
          <div className="app-shell">
            <VisitorTracker />
            <Navbar />
            <div className="app-workspace">
              <main className="app-main">
              <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/terms" element={<TermsPrivacy />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute roles={['user']}>
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute roles={['user']}>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/notifications"
                element={
                  <ProtectedRoute roles={['user']}>
                    <Notifications />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/browse"
                element={
                  <ProtectedRoute roles={['user']}>
                    <Browse />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/browse/:profileId"
                element={
                  <ProtectedRoute roles={['user']}>
                    <BrowseDetail />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/requests"
                element={
                  <ProtectedRoute roles={['user']}>
                    <MyRequests />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/connections"
                element={
                  <ProtectedRoute roles={['user']}>
                    <MyConnections />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment"
                element={
                  <ProtectedRoute roles={['user']}>
                    <PaymentDetails />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboardPage />} />
                <Route path="profiles" element={<AdminProfilesPage />} />
                <Route path="profiles/:userId" element={<AdminProfileDetailPage />} />
                <Route path="requests" element={<AdminRequestsPage />} />
                <Route path="connections" element={<AdminConnectionsPage />} />
                <Route path="messages" element={<AdminContactMessagesPage />} />
                <Route path="payments" element={<AdminPaymentsPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
              </Routes>
              </main>
            </div>
            <Toaster />
          </div>
        </AdminStatsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
