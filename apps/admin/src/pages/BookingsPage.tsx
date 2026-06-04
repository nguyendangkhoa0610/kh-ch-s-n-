import { useEffect, useState } from 'react'
import { api, type Booking, type GuestProfile } from '../lib/api'

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

function exportCSV(bookings: Booking[]) {
  const headers = ['Mã', 'Khách', 'Email', 'SĐT', 'Phòng', 'Check-in', 'Check-out', 'Đêm', 'Tổng tiền', 'Trạng thái']
  const rows = bookings.map(b => [
    b.code,
    b.user.name,
    b.user.email ?? '',
    b.user.phone ?? '',
    b.room ? `${b.room.number} (${b.room.roomType.name})` : 'Chưa assign',
    new Date(b.checkIn).toLocaleDateString('vi-VN'),
    new Date(b.checkOut).toLocaleDateString('vi-VN'),
    String(calcNights(b.checkIn, b.checkOut)),
    String(b.totalAmount),
    STATUS_META[b.status]?.label ?? b.status,
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url
  a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`
  a.click(); URL.revokeObjectURL(url)
}

export function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [detail, setDetail] = useState<Booking | null>(null)
  const [guestProfile, setGuestProfile] = useState<GuestProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)

  const showGuestProfile = async (userId: string) => {
    setLoadingProfile(true)
    try {
      const profile = await api.getGuestProfile(userId)
      setGuestProfile(profile)
    } catch { /* ignore */ } finally { setLoadingProfile(false) }
  }

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

  const q = search.toLowerCase().trim()
  const filtered = q
    ? bookings.filter(b =>
        b.code.toLowerCase().includes(q) ||
        b.user.name.toLowerCase().includes(q) ||
        (b.user.email ?? '').toLowerCase().includes(q) ||
        (b.room?.number ?? '').toLowerCase().includes(q) ||
        (b.room?.roomType.name ?? '').toLowerCase().includes(q)
      )
    : bookings

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Lora, serif' }}>
          Quản lý Đặt phòng
        </h2>
        <button
          onClick={() => exportCSV(filtered)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          ⬇️ Export CSV
        </button>
      </div>

      {error && (
        <div className="mb-5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Tìm theo mã, tên khách, số phòng..."
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
        />
      </div>

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
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            {search ? `Không tìm thấy kết quả cho "${search}"` : 'Không có đặt phòng nào.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="px-4 py-2 border-b border-slate-100 text-xs text-slate-400">
              {filtered.length} kết quả{search ? ` cho "${search}"` : ''}
            </div>
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
                {filtered.map((b) => {
                  const meta = STATUS_META[b.status]
                  const nextStatus = NEXT_STATUS[b.status]
                  const nights = calcNights(b.checkIn, b.checkOut)
                  return (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <button onClick={() => setDetail(b)}
                          className="font-mono text-xs font-semibold text-emerald-700 hover:underline">
                          {b.code}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => showGuestProfile(b.user.id)}
                          className="text-sm font-medium text-slate-800 hover:text-emerald-700 hover:underline text-left">
                          {b.user.name}
                        </button>
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

      {/* Guest Profile modal */}
      {(guestProfile || loadingProfile) && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setGuestProfile(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {loadingProfile ? (
              <div className="p-12 text-center text-slate-400">Đang tải hồ sơ khách...</div>
            ) : guestProfile ? (
              <>
                <div className="bg-slate-800 px-6 py-5 text-white flex items-center justify-between sticky top-0 rounded-t-2xl">
                  <div>
                    <p className="text-slate-300 text-xs">Hồ sơ khách hàng</p>
                    <p className="font-bold text-lg">{guestProfile.user.name}</p>
                  </div>
                  <button onClick={() => setGuestProfile(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">✕</button>
                </div>
                <div className="p-6 space-y-5 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Email', value: guestProfile.user.email ?? '—' },
                      { label: 'Điện thoại', value: guestProfile.user.phone ?? '—' },
                      { label: 'Eco Points', value: `${guestProfile.user.ecoPoints} điểm` },
                      { label: 'Thành viên từ', value: new Date(guestProfile.user.createdAt).toLocaleDateString('vi-VN') },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-slate-50 rounded-xl p-3">
                        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                        <p className="font-semibold text-slate-700">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: 'Tổng booking', value: guestProfile.stats.totalBookings, color: 'text-blue-600' },
                      { label: 'Hoàn thành', value: guestProfile.stats.completedBookings, color: 'text-emerald-600' },
                      { label: 'Đã hủy', value: guestProfile.stats.cancelledBookings, color: 'text-red-500' },
                      { label: 'Chi tiêu', value: formatPrice(guestProfile.stats.totalSpend), color: 'text-amber-600' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-white border border-slate-100 rounded-xl p-3">
                        <p className={`font-bold ${color} text-sm`}>{value}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Lịch sử đặt phòng</p>
                    <div className="space-y-2">
                      {guestProfile.bookings.map(b => (
                        <div key={b.id} className="flex items-center gap-3 border border-slate-100 rounded-xl p-3">
                          <div className="flex-1">
                            <span className="font-mono text-xs font-bold text-emerald-700">{b.code}</span>
                            <span className="text-xs text-slate-500 ml-2">{b.room?.roomType?.name ?? '—'}</span>
                            <p className="text-xs text-slate-400 mt-0.5">{formatDate(b.checkIn)} → {formatDate(b.checkOut)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold text-slate-700">{formatPrice(b.totalAmount)}</p>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_META[b.status]?.color ?? 'bg-slate-100 text-slate-500'}`}>
                              {STATUS_META[b.status]?.label ?? b.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-emerald-900 px-6 py-5 text-white flex items-center justify-between sticky top-0">
              <div>
                <p className="text-emerald-300 text-xs">Chi tiết đặt phòng</p>
                <p className="font-mono text-lg font-bold">{detail.code}</p>
              </div>
              <button onClick={() => setDetail(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">✕</button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Khách hàng</p>
                <p className="font-semibold text-slate-800">{detail.user.name}</p>
                <p className="text-slate-500">{detail.user.email}</p>
                <p className="text-slate-500">{detail.user.phone}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Nhận phòng</p>
                  <p className="font-medium text-slate-700">{formatDate(detail.checkIn)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Trả phòng</p>
                  <p className="font-medium text-slate-700">{formatDate(detail.checkOut)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Phòng</p>
                  <p className="font-medium text-slate-700">{detail.room ? `${detail.room.number} · ${detail.room.roomType.name}` : 'Chưa assign'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Số khách</p>
                  <p className="font-medium text-slate-700">{detail.guests} người</p>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500">Tổng tiền</span>
                  <span className="font-bold text-slate-800">{formatPrice(detail.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Đặt cọc 30%</span>
                  <span>{formatPrice(Math.round(detail.totalAmount * 0.3))}</span>
                </div>
              </div>
              {detail.notes && (
                <div className="bg-amber-50 rounded-xl px-4 py-3 text-amber-700 text-xs border-t border-amber-100">
                  <strong>Ghi chú:</strong> {detail.notes}
                </div>
              )}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-400">Đặt lúc {new Date(detail.createdAt).toLocaleString('vi-VN')}</p>
                <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_META[detail.status]?.color ?? 'bg-slate-100 text-slate-500'}`}>
                  {STATUS_META[detail.status]?.label ?? detail.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
