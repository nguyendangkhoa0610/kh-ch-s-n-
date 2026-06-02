import { useState } from 'react'
import { useAuth } from '../../lib/auth'

type BookingInfo = {
  id: string; code: string; status: string
  checkIn: string; checkOut: string; guests: number
  user: { name: string; phone: string; email: string }
  room: { number: string; roomType: { name: string } } | null
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function StaffCheckInPage() {
  const { getHeaders } = useAuth()
  const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'
  const [query, setQuery] = useState('')
  const [booking, setBooking] = useState<BookingInfo | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)
  const [success, setSuccess] = useState(false)

  async function search() {
    if (!query.trim()) return
    setLoading(true); setError(''); setBooking(null); setSuccess(false)
    try {
      const res = await fetch(`${BASE}/mobile/staff/bookings/by-qr?token=${encodeURIComponent(query.trim())}`, { headers: getHeaders() })
      if (!res.ok) {
        setError('Không tìm thấy booking với mã này.')
        return
      }
      const json = await res.json() as { data: BookingInfo }
      setBooking(json.data)
    } catch { setError('Lỗi kết nối API.') }
    finally { setLoading(false) }
  }

  async function doCheckIn() {
    if (!booking) return
    setCheckingIn(true)
    try {
      const res = await fetch(`${BASE}/mobile/staff/bookings/${booking.id}/checkin`, {
        method: 'PATCH', headers: getHeaders(),
      })
      if (!res.ok) throw new Error()
      setSuccess(true)
      setBooking(b => b ? { ...b, status: 'CHECKED_IN' } : b)
    } catch { alert('Check-in thất bại.') }
    finally { setCheckingIn(false) }
  }

  const STATUS_COLOR: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700', CONFIRMED: 'bg-blue-100 text-blue-700',
    CHECKED_IN: 'bg-emerald-100 text-emerald-700', COMPLETED: 'bg-slate-100 text-slate-500',
  }
  const STATUS_LABEL: Record<string, string> = {
    PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', CHECKED_IN: 'Đang lưu trú', COMPLETED: 'Hoàn thành',
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Lora, serif' }}>Check-in khách</h2>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
        <p className="text-sm font-semibold text-slate-700 mb-3">Nhập mã đặt phòng hoặc token QR</p>
        <div className="flex gap-3">
          <input value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="VD: TH-2026-XXXX hoặc token QR..."
            className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <button onClick={search} disabled={loading}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors">
            {loading ? 'Tìm...' : 'Tìm kiếm'}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">⚠️ {error}</p>}
      </div>

      {/* Result */}
      {booking && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Thông tin booking</h3>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLOR[booking.status] ?? 'bg-slate-100 text-slate-500'}`}>
              {STATUS_LABEL[booking.status] ?? booking.status}
            </span>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-slate-400 text-xs mb-1">Khách</p><p className="font-semibold text-slate-800">{booking.user.name}</p></div>
              <div><p className="text-slate-400 text-xs mb-1">Mã booking</p><p className="font-mono text-slate-800">{booking.code}</p></div>
              <div><p className="text-slate-400 text-xs mb-1">SĐT</p><p className="text-slate-800">{booking.user.phone}</p></div>
              <div><p className="text-slate-400 text-xs mb-1">Phòng</p><p className="text-slate-800">{booking.room?.number ?? '—'} · {booking.room?.roomType.name ?? '—'}</p></div>
              <div><p className="text-slate-400 text-xs mb-1">Check-in</p><p className="text-slate-800">{fmt(booking.checkIn)}</p></div>
              <div><p className="text-slate-400 text-xs mb-1">Check-out</p><p className="text-slate-800">{fmt(booking.checkOut)}</p></div>
            </div>

            {success ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm font-semibold text-center">
                ✅ Check-in thành công! Chào mừng {booking.user.name}!
              </div>
            ) : booking.status === 'CONFIRMED' ? (
              <button onClick={doCheckIn} disabled={checkingIn}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl transition-colors">
                {checkingIn ? 'Đang xử lý...' : '✅ Xác nhận Check-in'}
              </button>
            ) : (
              <p className="text-center text-sm text-slate-400 py-2">
                {booking.status === 'CHECKED_IN' ? 'Khách đã check-in rồi.' : 'Booking chưa được xác nhận.'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
