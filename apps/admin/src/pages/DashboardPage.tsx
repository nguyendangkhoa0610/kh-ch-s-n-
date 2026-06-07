import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts'
import { api, type Summary, type RevenuePoint } from '../lib/api'

const STATUS_COLOR: Record<string, string> = {
  PENDING:    'bg-amber-100 text-amber-700',
  CONFIRMED:  'bg-blue-100 text-blue-700',
  CHECKED_IN: 'bg-emerald-100 text-emerald-700',
  COMPLETED:  'bg-slate-100 text-slate-600',
  CANCELLED:  'bg-red-100 text-red-500',
}
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đang lưu trú', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy',
}

function formatPrice(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}
function formatPriceFull(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}
function formatDate(s: string) {
  return new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

export function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [chart, setChart] = useState<RevenuePoint[]>([])
  const [chartDays, setChartDays] = useState(7)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.getSummary(), api.getRevenueChart(chartDays)])
      .then(([s, c]) => { setSummary(s); setChart(c) })
      .catch(() => setError('Không kết nối được API.'))
      .finally(() => setLoading(false))
  }, [chartDays])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400 gap-3">
      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      Đang tải...
    </div>
  )

  const kpis = summary ? [
    { label: 'Tổng doanh thu', value: formatPriceFull(summary.totalRevenue), color: 'text-emerald-600', icon: '💰' },
    { label: 'Tổng đặt phòng', value: String(summary.totalBookings), color: 'text-blue-600', icon: '📅' },
    { label: 'Phòng đang trống', value: `${summary.roomsAvailable} / ${summary.roomsTotal}`, color: 'text-slate-700', icon: '🛏' },
    { label: 'Công suất phòng', value: `${summary.occupancyRate}%`, color: 'text-violet-600', icon: '📊' },
  ] : []

  const todayKpis = summary ? [
    { label: 'Check-in hôm nay', value: String(summary.todayCheckins), color: 'text-blue-600', icon: '✈️' },
    { label: 'Check-out hôm nay', value: String(summary.todayCheckouts), color: 'text-amber-600', icon: '🧳' },
    { label: 'Chờ xác nhận', value: String(summary.pendingBookings), color: summary.pendingBookings > 0 ? 'text-red-600' : 'text-slate-600', icon: '⏳' },
    { label: 'ADR', value: formatPriceFull(summary.adr), color: 'text-emerald-600', icon: '💵' },
  ] : []

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Lora, serif' }}>
        Tổng quan
      </h2>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm">⚠️ {error}</div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{k.icon}</span>
              <span className="text-xs text-slate-500 font-medium">{k.label}</span>
            </div>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Today KPIs */}
      {todayKpis.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {todayKpis.map((k) => (
            <div key={k.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{k.icon}</span>
                <span className="text-xs text-slate-400 font-medium">{k.label}</span>
              </div>
              <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Revenue line chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-slate-800 text-sm">Doanh thu ({chartDays} ngày qua)</h3>
            <div className="flex gap-1">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setChartDays(d)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                    chartDays === d ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {d}N
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chart} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tickFormatter={formatPrice} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                formatter={(v) => [formatPriceFull(Number(v)), 'Doanh thu']}
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2.5} dot={{ r: 3, fill: '#059669' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bookings bar chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-800 text-sm mb-5">Số đặt phòng ({chartDays} ngày qua)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chart} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                formatter={(v) => [Number(v), 'Đặt phòng']}
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Bar dataKey="bookings" fill="#6ee7b7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm">Đặt phòng cần xử lý</h3>
        </div>
        {!summary?.recentBookings.length ? (
          <p className="p-5 text-slate-400 text-sm">Không có booking cần xử lý.</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {summary.recentBookings.map((b) => (
              <div key={b.id} className="px-5 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{b.user.name}</p>
                  <p className="text-xs text-slate-400">{b.code} · {b.room?.roomType.name ?? '—'} · {formatDate(b.checkIn)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold text-slate-700">{formatPriceFull(b.totalAmount)}</span>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[b.status] ?? 'bg-slate-100 text-slate-500'}`}>
                    {STATUS_LABEL[b.status] ?? b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
