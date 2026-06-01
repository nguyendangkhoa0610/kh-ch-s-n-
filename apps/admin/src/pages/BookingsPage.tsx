import { useEffect, useState } from 'react'
import { api, type Booking } from '../lib/api'

const STATUSES = ['', 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED'] as const

const STATUS_META: Record<string, { label: string; color: string }> = {
  PENDING:    { label: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-700' },
  CONFIRMED:  { label: 'Đã xác nhận',  color: 'bg-blue-100 text-blue-700' },
  CHECKED_IN: { label: 'Đang lưu trú', color: 'bg-emerald-100 text-emerald-700' },
  COMPLETED:  { label: 'Hoàn thành',   color: 'bg-slate-100 text-slate-600' },
  CANCELLED:  { label: 'Đã hủy',       color: 'bg-red-100 text-red-500' },
}

const FILTER_LABELS: Record<string, string> = {
  '': 'Tất cả',
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đang lưu trú',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
}

const NEXT_STATUS: Record<string, string> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'CHECKED_IN',
  CHECKED_IN: 'COMPLETED',
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

function calcNights(checkIn: string, checkOut: string) {
  return Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000)
}

export function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  function load() {
    setLoading(true)
    api.getBookings(filter || undefined)
      .then(setBookings)
      .catch(() => setError('Không kết nối được API.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter])

  async function handleStatusUpdate(booking: Booking, newStatus: string) {
    setUpdating(booking.id)
    try {
      const updated = await api.updateBookingStatus(booking.id, newStatus)
      setBookings((prev) => prev.map((b) => b.id === updated.id ? { ...b, status: updated.status } : b))
    } catch {
      alert('Cập nhật thất bại.')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Lora, serif' }}>
          Quản lý Đặt phòng
        </h2>
        <span className="text-sm text-slate-400">{bookings.length} kết quả</span>
      </div>

      {error && (
        <div className="mb-5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
              filter === s
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400'
            }`}
          >
            {FILTER_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm gap-3">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Đang tải...
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Không có đặt phòng nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Mã', 'Khách', 'Phòng', 'Check-in → out', 'Đêm', 'Tổng tiền', 'Trạng thái', 'Thao tác'].map((col) => (
                    <th key={col} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bookings.map((b) => {
                  const meta = STATUS_META[b.status]
                  const nextStatus = NEXT_STATUS[b.status]
                  const nights = calcNights(b.checkIn, b.checkOut)
                  return (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-emerald-700">{b.code}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-800">{b.user.name}</p>
                        <p className="text-xs text-slate-400">{b.user.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {b.room ? (
                          <span>{b.room.number} · <span className="text-xs text-slate-400">{b.room.roomType.name}</span></span>
                        ) : (
                          <span className="text-slate-300 italic text-xs">Chưa assign</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                        {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-slate-700 font-medium">{nights}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800 whitespace-nowrap">
                        {formatPrice(b.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${meta?.color ?? 'bg-slate-100 text-slate-500'}`}>
                          {meta?.label ?? b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {nextStatus && (
                            <button
                              disabled={updating === b.id}
                              onClick={() => handleStatusUpdate(b, nextStatus)}
                              className="text-xs px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg transition-colors disabled:opacity-50"
                            >
                              {updating === b.id ? '...' : STATUS_META[nextStatus]?.label}
                            </button>
                          )}
                          {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (
                            <button
                              disabled={updating === b.id}
                              onClick={() => handleStatusUpdate(b, 'CANCELLED')}
                              className="text-xs px-3 py-1 bg-red-50 hover:bg-red-100 text-red-500 font-semibold rounded-lg transition-colors disabled:opacity-50"
                            >
                              Hủy
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
