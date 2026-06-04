import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { ErrorBoundary } from '../ErrorBoundary'

const NAV_ALL = [
  { to: '/dashboard', label: 'Tổng quan', icon: '📊' },
  { to: '/bookings', label: 'Đặt phòng', icon: '📅' },
  { to: '/rooms', label: 'Phòng', icon: '🛏' },
  { to: '/housekeeping', label: 'Housekeeping', icon: '🧹' },
  { to: '/activities', label: 'Hoạt động', icon: '🎯' },
  { to: '/menu', label: 'Nhà hàng', icon: '🍽️' },
  { to: '/reports', label: 'Báo cáo', icon: '📈' },
  { to: '/pricing', label: 'Dynamic Pricing', icon: '💰' },
  { to: '/vouchers', label: 'Gift Voucher', icon: '🎁' },
  { to: '/promo', label: 'Mã giảm giá', icon: '🎟️' },
  { to: '/reviews', label: 'Đánh giá', icon: '⭐' },
  { to: '/realtime', label: 'Real-time', icon: '📡' },
  { to: '/staff', label: 'Nhân viên', icon: '👥', adminOnly: true },
  { to: '/settings', label: 'Cài đặt', icon: '⚙️', adminOnly: true },
]

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  MANAGER: 'Quản lý',
  STAFF: 'Nhân viên',
}

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navItems = NAV_ALL.filter(item => !item.adminOnly || user?.role === 'ADMIN')

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-emerald-950 text-white flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center text-sm">🌿</div>
            <div>
              <p className="text-sm font-bold" style={{ fontFamily: 'Lora, Georgia, serif', lineHeight: '1.4', letterSpacing: '0.01em' }}>Trầm Hương</p>
              <p className="text-emerald-400 text-[10px] uppercase tracking-widest">Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-700 text-white'
                    : 'text-emerald-300 hover:bg-emerald-900 hover:text-white'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t border-emerald-800">
          {user && (
            <div className="px-3 py-2 mb-1">
              <p className="text-xs text-emerald-400 truncate">{user.email}</p>
              <p className="text-[11px] text-emerald-600 uppercase tracking-wide">{ROLE_LABELS[user.role] ?? user.role}</p>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-emerald-400 hover:bg-red-900/40 hover:text-red-300 transition-colors"
          >
            <span className="text-base">🚪</span>
            Đăng xuất
          </button>
          <p className="text-emerald-800 text-[10px] px-3 mt-2">v0.3.0 — Phase 4</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0">
          <p className="text-slate-500 text-sm">Trầm Hương Eco-Resort · Bình Định</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-400 text-xs">
              {import.meta.env.VITE_API_URL ? 'Production API' : 'Local API'}
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
