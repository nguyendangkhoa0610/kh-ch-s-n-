import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'

type Stats = { pendingSOS: number; checkInsToday: number; pendingBookings: number }
type Shift = { id: string; startTime: string; endTime: string; area: string; notes?: string | null }
type BookingRow = {
  id: string; code: string; status: string
  checkIn: string; checkOut: string; guests: number
  user: { name: string; phone: string }
  room: { number: string; roomType: { name: string } } | null
}

const AREA_LABELS: Record<string, string> = {
  reception: '🏨 Lễ tân', beach: '🏖 Bãi biển',
  kitchen: '🍳 Bếp', housekeeping: '🛏 Buồng phòng', all: '🌿 Toàn khu',
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

export function StaffHomePage() {
  const { getHeaders } = useAuth()
  const navigate = useNavigate()
  const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'
  const [stats, setStats] = useState<Stats | null>(null)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [arrivals, setArrivals] = useState<BookingRow[]>([])
  const [departures, setDepartures] = useState<BookingRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${BASE}/mobile/staff/stats`, { headers: getHeaders() }).then(r => r.json()),
      fetch(`${BASE}/mobile/staff/shifts`, { headers: getHeaders() }).then(r => r.json()),
      fetch(`${BASE}/mobile/staff/bookings/today`, { headers: getHeaders() }).then(r => r.json()),
    ]).then(([s, sh, td]) => {
      setStats((s as { data: Stats }).data)
      const shiftData = sh as { data: { shifts?: Shift[] } | Shift[] }
      setShifts(Array.isArray(shiftData.data) ? shiftData.data : (shiftData.data as any).shifts ?? [])
      const todayData = (td as { data: { arrivals: BookingRow[]; departures: BookingRow[] } }).data
      setArrivals(todayData.arrivals ?? [])
      setDepartures(todayData.departures ?? [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })

  function goCheckIn(code: string) {
    navigate(`/nv/checkin?code=${code}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Lora, serif' }}>Xin chào! 👋</h2>
        <p className="text-slate-500 text-sm mt-1">{today}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
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

      {/* Check-in hôm nay */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">✅ Cần check-in hôm nay ({arrivals.length})</h3>
        </div>
        {loading ? (
          <p className="p-5 text-slate-400 text-sm">Đang tải...</p>
        ) : arrivals.length === 0 ? (
          <p className="p-5 text-slate-400 text-sm">Không có khách check-in hôm nay.</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {arrivals.map(b => (
              <div key={b.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{b.user.name}</p>
                  <p className="text-xs text-slate-400">
                    {b.room ? `Phòng ${b.room.number} · ${b.room.roomType.name}` : 'Chưa assign phòng'} · {b.guests} khách
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-xs text-emerald-700 font-semibold">{b.code}</p>
                  <p className="text-xs text-slate-400">{b.user.phone}</p>
                </div>
                <button
                  onClick={() => goCheckIn(b.code)}
                  className="shrink-0 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Check-in →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Check-out hôm nay */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">🌿 Cần check-out hôm nay ({departures.length})</h3>
        </div>
        {loading ? (
          <p className="p-5 text-slate-400 text-sm">Đang tải...</p>
        ) : departures.length === 0 ? (
          <p className="p-5 text-slate-400 text-sm">Không có khách check-out hôm nay.</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {departures.map(b => (
              <div key={b.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{b.user.name}</p>
                  <p className="text-xs text-slate-400">
                    {b.room ? `Phòng ${b.room.number} · ${b.room.roomType.name}` : '—'} · {b.guests} khách
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-xs text-slate-700 font-semibold">{b.code}</p>
                  <p className="text-xs text-slate-400">{b.user.phone}</p>
                </div>
                <button
                  onClick={() => goCheckIn(b.code)}
                  className="shrink-0 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Check-out →
                </button>
              </div>
            ))}
          </div>
        )}
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
                  <p className="text-xs text-slate-400">{fmtTime(sh.startTime)} → {fmtTime(sh.endTime)}</p>
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
