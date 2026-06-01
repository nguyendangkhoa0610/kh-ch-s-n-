import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api, type RevenuePoint } from '../lib/api'

function formatPriceFull(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}
function formatPrice(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

export function ReportsPage() {
  const [data, setData] = useState<RevenuePoint[]>([])
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getRevenueChart(days)
      .then(setData)
      .finally(() => setLoading(false))
  }, [days])

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0)
  const totalBookings = data.reduce((s, d) => s + d.bookings, 0)
  const avgPerBooking = totalBookings ? Math.round(totalRevenue / totalBookings) : 0
  const peakDay = data.reduce((best, d) => d.revenue > (best?.revenue ?? 0) ? d : best, data[0])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Lora, serif' }}>Báo cáo</h2>
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
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

      {/* Area chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
        <h3 className="font-semibold text-slate-800 text-sm mb-5">Doanh thu theo ngày</h3>
        {loading ? (
          <div className="flex justify-center py-16 text-slate-400 text-sm">Đang tải...</div>
        ) : (
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
                {['Ngày', 'Đặt phòng', 'Doanh thu'].map((h) => (
                  <th key={h} className="px-5 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[...data].reverse().map((row) => (
                <tr key={row.date} className="hover:bg-slate-50">
                  <td className="px-5 py-2.5 text-sm text-slate-600">{row.date}</td>
                  <td className="px-5 py-2.5 text-sm font-medium text-slate-800">{row.bookings}</td>
                  <td className="px-5 py-2.5 text-sm font-semibold text-emerald-700">{formatPriceFull(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
