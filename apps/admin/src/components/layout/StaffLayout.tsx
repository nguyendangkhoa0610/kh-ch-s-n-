import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { ErrorBoundary } from '../ErrorBoundary'

const navItems = [
  { to: '/nv', label: 'Hôm nay', icon: '🏠', end: true },
  { to: '/nv/checkin', label: 'Check-in', icon: '✅', end: false },
  { to: '/nv/alerts', label: 'SOS / Sự cố', icon: '🚨', end: false },
  { to: '/nv/chat', label: 'Chat nội bộ', icon: '💬', end: false },
]

export function StaffLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-[#064E3B] text-white flex flex-col shrink-0">
        <div className="p-5 border-b border-emerald-900">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center text-sm">🌿</div>
            <div>
              <p className="text-sm font-bold" style={{ fontFamily: 'Lora, Georgia, serif', lineHeight: '1.4', letterSpacing: '0.01em' }}>Trầm Hương</p>
              <p className="text-emerald-400 text-[10px] uppercase tracking-widest">Nhân viên</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 min-h-0 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-emerald-700 text-white' : 'text-emerald-300 hover:bg-emerald-900 hover:text-white'
                }`
              }>
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-emerald-900">
          {user && (
            <div className="px-3 py-2 mb-1">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[11px] text-emerald-400">{user.email}</p>
            </div>
          )}
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-emerald-400 hover:bg-red-900/40 hover:text-red-300 transition-colors">
            <span>🚪</span> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0">
          <p className="text-slate-600 text-sm font-medium">Trầm Hương Eco-Resort · Cổng nhân viên</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-400 text-xs">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}</span>
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
