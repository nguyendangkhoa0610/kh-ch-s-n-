import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api, type RevenuePoint, type OccupancyPoint, type Summary } from '../lib/api'

function formatPriceFull(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}
function formatPrice(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

export function ReportsPage() {
  const [activeChart, setActiveChart] = useState<'revenue' | 'occupancy'>('revenue')
  const [data, setData] = useState<RevenuePoint[]>([])
  const [occupancy, setOccupancy] = useState<OccupancyPoint[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.getRevenueChart(days),
      api.getOccupancyChart(days),
      api.getSummary(),
    ]).then(([rev, occ, sum]) => {
      setData(rev)
      setOccupancy(occ)
      setSummary(sum)
    }).finally(() => setLoading(false))
  }, [days])

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0)
  const totalBookings = data.reduce((s, d) => s + d.bookings, 0)
  const avgPerBooking = totalBookings ? Math.round(totalRevenue / totalBookings) : 0
  const peakDay = data.reduce((best, d) => d.revenue > (best?.revenue ?? 0) ? d : best, data[0])
  const avgOccupancy = occupancy.length
    ? Math.round(occupancy.reduce((s, d) => s + d.occupancyRate, 0) / occupancy.length)
    : 0

  const BASE = import.meta.env.VITE_API_URL ?? '/api'
  const exportRevenue = () => window.open(`${BASE}/export/revenue?days=${days}`, '_blank')
  const exportBookings = () => window.open(`${BASE}/export/bookings`, '_blank')

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Lora, serif' }}>Báo cáo</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {[
              { d: 7, label: '7N' }, { d: 14, label: '14N' },
              { d: 30, label: '1T' }, { d: 90, label: '3T' },
            ].map(({ d, label }) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  days === d ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button onClick={exportRevenue}
            className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 border border-emerald-200">
            ↓ Doanh thu CSV
          </button>
          <button onClick={exportBookings}
            className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200">
            ↓ Đặt phòng CSV
          </button>
        </div>
      </div>

      {/* Today's snapshot */}
      {summary && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-blue-700">{summary.todayCheckins}</p>
            <p className="text-xs text-blue-500 mt-1">Check-in hôm nay</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-700">{summary.todayCheckouts}</p>
            <p className="text-xs text-amber-500 mt-1">Check-out hôm nay</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{summary.pendingBookings}</p>
            <p className="text-xs text-red-400 mt-1">Đặt phòng chờ duyệt</p>
          </div>
        </div>
      )}

      {/* Revenue KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[
          { label: 'Doanh thu', value: formatPriceFull(totalRevenue), icon: '💰', color: 'text-emerald-600' },
          { label: 'Đặt phòng', value: String(totalBookings), icon: '📅', color: 'text-blue-600' },
          { label: 'TB / booking', value: formatPriceFull(avgPerBooking), icon: '📊', color: 'text-violet-600' },
          { label: 'Ngày cao điểm', value: peakDay?.label ?? '—', icon: '🏆', color: 'text-amber-600' },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{k.icon}</span>
              <span className="text-xs text-slate-400 font-medium">{k.label}</span>
            </div>
            <p className={`text-lg font-bold ${k.color} leading-tight`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Occupancy KPI cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Occupancy TB', value: `${avgOccupancy}%`, icon: '🏨', color: 'text-emerald-600', sub: `Hiện tại: ${summary?.occupancyRate ?? 0}%` },
          { label: 'ADR (TB/đêm)', value: formatPriceFull(summary?.adr ?? 0), icon: '💵', color: 'text-blue-600', sub: 'Doanh thu trung bình / đêm' },
          { label: 'RevPAR', value: formatPriceFull(summary?.revpar ?? 0), icon: '📈', color: 'text-violet-600', sub: 'ADR × Occupancy' },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{k.icon}</span>
              <span className="text-xs text-slate-400 font-medium">{k.label}</span>
            </div>
            <p className={`text-lg font-bold ${k.color} leading-tight`}>{k.value}</p>
            <p className="text-xs text-slate-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Chart toggle + chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveChart('revenue')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeChart === 'revenue' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
            >
              💰 Doanh thu
            </button>
            <button
              onClick={() => setActiveChart('occupancy')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeChart === 'occupancy' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
            >
              🏨 Công suất
            </button>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-16 text-slate-400 text-sm">Đang tải...</div>
        ) : activeChart === 'revenue' ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} interval={days > 14 ? 6 : 1} />
              <YAxis tickFormatter={formatPrice} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                formatter={(v) => [formatPriceFull(Number(v)), 'Doanh thu']}
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={occupancy} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} interval={days > 14 ? 6 : 1} />
              <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 100]} />
              <Tooltip
                formatter={(v) => [`${v}%`, 'Công suất phòng']}
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Area type="monotone" dataKey="occupancyRate" stroke="#6366f1" strokeWidth={2.5} fill="url(#occGrad)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Data table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm">Chi tiết theo ngày</h3>
        </div>
        <div className="overflow-x-auto max-h-64 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                {['Ngày', 'Đặt phòng', 'Doanh thu', 'Công suất'].map((h) => (
                  <th key={h} className="px-5 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[...data].reverse().map((row, i) => {
                const occ = [...occupancy].reverse()[i]
                return (
                  <tr key={row.date} className="hover:bg-slate-50">
                    <td className="px-5 py-2.5 text-sm text-slate-600">{row.date}</td>
                    <td className="px-5 py-2.5 text-sm font-medium text-slate-800">{row.bookings}</td>
                    <td className="px-5 py-2.5 text-sm font-semibold text-emerald-700">{formatPriceFull(row.revenue)}</td>
                    <td className="px-5 py-2.5 text-sm text-violet-600 font-medium">{occ ? `${occ.occupancyRate}%` : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
