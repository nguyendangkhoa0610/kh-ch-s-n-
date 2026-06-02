import { useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth'

type Stats = { pendingSOS: number; checkInsToday: number; pendingBookings: number }
type Shift = { id: string; startTime: string; endTime: string; area: string; notes?: string | null }

const AREA_LABELS: Record<string, string> = {
  reception: '🏨 Lễ tân', beach: '🏖 Bãi biển',
  kitchen: '🍳 Bếp', housekeeping: '🛏 Buồng phòng', all: '🌿 Toàn khu',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

export function StaffHomePage() {
  const { getHeaders } = useAuth()
  const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'
  const [stats, setStats] = useState<Stats | null>(null)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${BASE}/mobile/staff/stats`, { headers: getHeaders() }).then(r => r.json()),
      fetch(`${BASE}/mobile/staff/shifts`, { headers: getHeaders() }).then(r => r.json()),
    ]).then(([s, sh]) => {
      setStats((s as { data: Stats }).data)
      const shiftData = sh as { data: { shifts?: Shift[] } | Shift[] }
      const shifts = Array.isArray(shiftData.data)
        ? shiftData.data
        : (shiftData.data as { shifts?: Shift[] }).shifts ?? []
      setShifts(shifts)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Lora, serif' }}>Xin chào! 👋</h2>
        <p className="text-slate-500 text-sm mt-1">{today}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'SOS mới', value: stats?.pendingSOS ?? 0, color: 'text-red-600', bg: 'bg-red-50 border-red-100', icon: '🚨' },
          { label: 'Check-in hôm nay', value: stats?.checkInsToday ?? 0, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', icon: '✅' },
          { label: 'Chờ xác nhận', value: stats?.pendingBookings ?? 0, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', icon: '⏳' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-5 ${s.bg}`}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <p className={`text-3xl font-bold ${s.color}`}>{loading ? '—' : s.value}</p>
            <p className="text-sm text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Ca trực */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Ca trực hôm nay</h3>
        </div>
        {loading ? (
          <p className="p-5 text-slate-400 text-sm">Đang tải...</p>
        ) : shifts.length === 0 ? (
          <p className="p-5 text-slate-400 text-sm">Không có ca trực hôm nay.</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {shifts.map(sh => (
              <div key={sh.id} className="px-5 py-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-xl">
                  {AREA_LABELS[sh.area]?.split(' ')[0] ?? '📋'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 text-sm">{AREA_LABELS[sh.area] ?? sh.area}</p>
                  <p className="text-xs text-slate-400">{fmt(sh.startTime)} → {fmt(sh.endTime)}</p>
                  {sh.notes && <p className="text-xs text-slate-500 mt-0.5">{sh.notes}</p>}
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-semibold">Hôm nay</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
