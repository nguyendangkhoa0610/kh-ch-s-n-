import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { AdminLayout } from './components/layout/AdminLayout'
import { StaffLayout } from './components/layout/StaffLayout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { BookingsPage } from './pages/BookingsPage'
import { RoomsPage } from './pages/RoomsPage'
import { ActivitiesPage } from './pages/ActivitiesPage'
import { ReportsPage } from './pages/ReportsPage'
import { StaffPage } from './pages/StaffPage'
import { RealtimePage } from './pages/RealtimePage'
import { ReviewsPage } from './pages/ReviewsPage'
import { PromoPage } from './pages/PromoPage'
import { StaffHomePage } from './pages/staff/StaffHomePage'
import { StaffCheckInPage } from './pages/staff/StaffCheckInPage'
import { StaffAlertsPage } from './pages/staff/StaffAlertsPage'
import { StaffChatPage } from './pages/staff/StaffChatPage'

function RequireAdmin() {
  const token = useAuth(s => s.token)
  const user = useAuth(s => s.user)
  if (!token) return <Navigate to="/login" replace />
  if (user?.role === 'STAFF') return <Navigate to="/nv" replace />
  return <AdminLayout />
}

function RequireStaff() {
  const token = useAuth(s => s.token)
  const user = useAuth(s => s.user)
  if (!token) return <Navigate to="/login" replace />
  if (user?.role !== 'STAFF') return <Navigate to="/dashboard" replace />
  return <StaffLayout />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Admin / Manager — prefix / */}
        <Route element={<RequireAdmin />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/realtime" element={<RealtimePage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/promo" element={<PromoPage />} />
        </Route>

        {/* Staff — prefix /nv */}
        <Route path="/nv" element={<RequireStaff />}>
          <Route index element={<StaffHomePage />} />
          <Route path="checkin" element={<StaffCheckInPage />} />
          <Route path="alerts" element={<StaffAlertsPage />} />
          <Route path="chat" element={<StaffChatPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
