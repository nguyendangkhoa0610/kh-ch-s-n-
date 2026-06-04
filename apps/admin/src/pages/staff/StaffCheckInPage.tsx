import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
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

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700', CONFIRMED: 'bg-blue-100 text-blue-700',
  CHECKED_IN: 'bg-emerald-100 text-emerald-700', COMPLETED: 'bg-slate-100 text-slate-500',
  CANCELLED: 'bg-red-100 text-red-500',
}
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đang lưu trú', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy',
}

export function StaffCheckInPage() {
  const { getHeaders } = useAuth()
  const [searchParams] = useSearchParams()
  const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'
  const [query, setQuery] = useState(searchParams.get('code') ?? '')
  const [booking, setBooking] = useState<BookingInfo | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [acting, setActing] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  // Auto-search nếu có code từ URL
  useEffect(() => {
    const code = searchParams.get('code')
    if (code) search(code)
  }, [])

  async function search(overrideQuery?: string) {
    const q = (overrideQuery ?? query).trim().toUpperCase()
    if (!q) return
    setLoading(true); setError(''); setBooking(null); setSuccessMsg('')
    try {
      if (q.startsWith('TH')) {
        const res = await fetch(`${BASE}/bookings/by-code/${q}`)
        if (!res.ok) { setError('Không tìm thấy booking với mã này.'); return }
        const json = await res.json() as { data: BookingInfo }
        setBooking(json.data)
      } else {
        // Coi là QR token → tìm qua by-qr
        const res = await fetch(`${BASE}/mobile/staff/bookings/by-qr?token=${encodeURIComponent(query.trim())}`, { headers: getHeaders() })
        if (!res.ok) { setError('Mã QR không hợp lệ hoặc đã hết hạn.'); return }
        const json = await res.json() as { data: {
          bookingId: string; bookingCode: string; status: string
          checkIn: string; checkOut: string; guests: number
          guestName: string; guestPhone: string
          roomNumber: string | null; roomName: string | null
        } }
        const d = json.data
        setBooking({
          id: d.bookingId,
          code: d.bookingCode,
          status: d.status,
          checkIn: d.checkIn,
          checkOut: d.checkOut,
          guests: d.guests,
          user: { name: d.guestName, phone: d.guestPhone, email: '' },
          room: d.roomNumber ? { number: d.roomNumber, roomType: { name: d.roomName ?? '' } } : null,
        })
      }
    } catch { setError('Lỗi kết nối API.') }
    finally { setLoading(false) }
  }

  async function doCheckIn() {
    if (!booking) return
    setActing(true)
    try {
      const res = await fetch(`${BASE}/mobile/staff/bookings/${booking.id}/checkin`, {
        method: 'PATCH', headers: getHeaders(),
      })
      if (!res.ok) throw new Error()
      setSuccessMsg(`✅ Check-in thành công! Chào mừng ${booking.user.name}!`)
      setBooking(b => b ? { ...b, status: 'CHECKED_IN' } : b)
    } catch { alert('Check-in thất bại.') }
    finally { setActing(false) }
  }

  async function doCheckOut() {
    if (!booking) return
    if (!confirm(`Xác nhận check-out cho ${booking.user.name}?\nMã: ${booking.code}`)) return
    setActing(true)
    try {
      const res = await fetch(`${BASE}/mobile/staff/bookings/${booking.id}/checkout`, {
        method: 'PATCH', headers: getHeaders(),
      })
      if (!res.ok) throw new Error()
      setSuccessMsg(`🌿 Check-out thành công! Hẹn gặp lại ${booking.user.name}!`)
      setBooking(b => b ? { ...b, status: 'COMPLETED' } : b)
    } catch { alert('Check-out thất bại.') }
    finally { setActing(false) }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Lora, serif' }}>Check-in / Check-out</h2>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
        <p className="text-sm font-semibold text-slate-700 mb-1">Nhập mã đặt phòng hoặc quét QR</p>
        <p className="text-xs text-slate-400 mb-3">Mã đặt phòng dạng <span className="font-mono">TH...</span> hoặc token QR từ app khách</p>
        <div className="flex gap-3">
          <input value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="VD: TH20260601234 hoặc token QR..."
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
              <div><p className="text-slate-400 text-xs mb-1">SĐT</p><p className="text-slate-800">{booking.user.phone || '—'}</p></div>
              <div><p className="text-slate-400 text-xs mb-1">Phòng</p><p className="text-slate-800">{booking.room ? `${booking.room.number} · ${booking.room.roomType.name}` : '—'}</p></div>
              <div><p className="text-slate-400 text-xs mb-1">Check-in</p><p className="text-slate-800">{fmt(booking.checkIn)}</p></div>
              <div><p className="text-slate-400 text-xs mb-1">Check-out</p><p className="text-slate-800">{fmt(booking.checkOut)}</p></div>
              <div><p className="text-slate-400 text-xs mb-1">Số khách</p><p className="text-slate-800">{booking.guests} người</p></div>
            </div>

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm font-semibold text-center">
                {successMsg}
              </div>
            )}

            {(booking.status === 'CONFIRMED' || booking.status === 'PENDING') && !successMsg && (
              <button onClick={doCheckIn} disabled={acting}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl transition-colors">
                {acting ? 'Đang xử lý...' : '✅ Xác nhận Check-in'}
              </button>
            )}

            {booking.status === 'CHECKED_IN' && (
              <button onClick={doCheckOut} disabled={acting}
                className="w-full py-3.5 bg-slate-700 hover:bg-slate-800 disabled:opacity-60 text-white font-bold rounded-xl transition-colors">
                {acting ? 'Đang xử lý...' : '🌿 Xác nhận Check-out'}
              </button>
            )}

            {booking.status === 'COMPLETED' && !successMsg && (
              <p className="text-center text-sm text-slate-400 py-2">Booking đã hoàn thành.</p>
            )}
            {booking.status === 'CANCELLED' && (
              <p className="text-center text-sm text-red-400 py-2">Booking đã bị hủy.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
