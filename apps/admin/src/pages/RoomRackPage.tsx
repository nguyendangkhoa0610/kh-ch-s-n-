import { useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'

type RoomTypeInfo = { name: string; slug: string }
type BookingInfo = {
  id: string; code: string; status: string
  checkIn: string; checkOut: string; guests: number
  user: { name: string; phone: string | null }
}
type HousekeepingInfo = { type: string; status: string; priority: string }

type RackRoom = {
  id: string
  number: string
  floor: number
  status: string
  roomType: RoomTypeInfo
  booking: BookingInfo | null
  housekeeping: HousekeepingInfo | null
}

type RackData = {
  rooms: RackRoom[]
  stats: { checkinsToday: number; checkoutsToday: number }
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

function roomDisplayStatus(room: RackRoom): {
  label: string; bg: string; text: string; border: string
} {
  if (room.status === 'MAINTENANCE')
    return { label: 'Bảo trì', bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-300' }
  if (room.housekeeping && room.status !== 'OCCUPIED')
    return { label: 'Đang dọn', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300' }
  if (room.status === 'OCCUPIED' || room.booking?.status === 'CHECKED_IN')
    return { label: 'Có khách', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300' }
  if (room.booking?.status === 'CONFIRMED')
    return { label: 'Đến hôm nay', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' }
  return { label: 'Trống', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300' }
}

export function RoomRackPage() {
  const [data, setData] = useState<RackData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<RackRoom | null>(null)
  const [filterFloor, setFilterFloor] = useState<number | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [updatingRoom, setUpdatingRoom] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await api.getRoomRack() as unknown as RackData
      setData(res)
    } catch { /* silently fail */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 60_000) // auto-refresh mỗi phút
    return () => clearInterval(interval)
  }, [load])

  async function handleStatusChange(roomId: string, status: string) {
    setUpdatingRoom(roomId)
    try {
      await api.updateRoomStatus(roomId, status)
      await load()
      setSelected(null)
    } catch { alert('Cập nhật thất bại') }
    finally { setUpdatingRoom(null) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400 text-sm gap-3">
      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      Đang tải...
    </div>
  )

  const rooms = data?.rooms ?? []
  const floors = [...new Set(rooms.map(r => r.floor))].sort()

  const filtered = rooms.filter(r => {
    if (filterFloor !== 'all' && r.floor !== filterFloor) return false
    if (filterStatus === 'all') return true
    const ds = roomDisplayStatus(r)
    if (filterStatus === 'occupied') return ds.label === 'Có khách'
    if (filterStatus === 'available') return ds.label === 'Trống'
    if (filterStatus === 'cleaning') return ds.label === 'Đang dọn'
    if (filterStatus === 'arriving') return ds.label === 'Đến hôm nay'
    if (filterStatus === 'maintenance') return ds.label === 'Bảo trì'
    return true
  })

  const counts = {
    total: rooms.length,
    occupied: rooms.filter(r => roomDisplayStatus(r).label === 'Có khách').length,
    available: rooms.filter(r => roomDisplayStatus(r).label === 'Trống').length,
    cleaning: rooms.filter(r => roomDisplayStatus(r).label === 'Đang dọn').length,
    arriving: rooms.filter(r => roomDisplayStatus(r).label === 'Đến hôm nay').length,
    maintenance: rooms.filter(r => r.status === 'MAINTENANCE').length,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Lora, serif' }}>
          Room Rack
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Tự cập nhật mỗi phút</span>
          <button onClick={load} className="text-xs px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">
            ↻ Làm mới
          </button>
        </div>
      </div>

      {/* Stat bar */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Tổng phòng', value: counts.total, color: 'text-slate-700', filter: 'all' },
          { label: 'Có khách', value: counts.occupied, color: 'text-red-600', filter: 'occupied' },
          { label: 'Trống', value: counts.available, color: 'text-emerald-600', filter: 'available' },
          { label: 'Đang dọn', value: counts.cleaning, color: 'text-amber-600', filter: 'cleaning' },
          { label: 'Check-in hôm nay', value: data?.stats.checkinsToday ?? 0, color: 'text-blue-600', filter: 'arriving' },
          { label: 'Bảo trì', value: counts.maintenance, color: 'text-slate-400', filter: 'maintenance' },
        ].map(s => (
          <button
            key={s.filter}
            onClick={() => setFilterStatus(filterStatus === s.filter ? 'all' : s.filter)}
            className={`bg-white rounded-xl border p-3 text-center transition-all ${filterStatus === s.filter ? 'border-emerald-400 shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}
          >
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Legend + floor filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Trống', bg: 'bg-emerald-100', text: 'text-emerald-700' },
            { label: 'Có khách', bg: 'bg-red-100', text: 'text-red-700' },
            { label: 'Đến hôm nay', bg: 'bg-blue-100', text: 'text-blue-700' },
            { label: 'Đang dọn', bg: 'bg-amber-100', text: 'text-amber-700' },
            { label: 'Bảo trì', bg: 'bg-slate-100', text: 'text-slate-500' },
          ].map(l => (
            <span key={l.label} className={`text-xs px-2.5 py-1 rounded-full font-medium ${l.bg} ${l.text}`}>{l.label}</span>
          ))}
        </div>
        <div className="flex gap-1">
          {['all', ...floors].map(f => (
            <button
              key={String(f)}
              onClick={() => setFilterFloor(f === 'all' ? 'all' : Number(f))}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterFloor === (f === 'all' ? 'all' : Number(f))
                  ? 'bg-emerald-700 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f === 'all' ? 'Tất cả tầng' : `Tầng ${f}`}
            </button>
          ))}
        </div>
      </div>

      {/* Room grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {filtered.map(room => {
          const ds = roomDisplayStatus(room)
          return (
            <button
              key={room.id}
              onClick={() => setSelected(room)}
              className={`${ds.bg} border-2 ${ds.border} rounded-xl p-3 text-left transition-all hover:shadow-md hover:scale-[1.02] active:scale-100`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-800 text-sm">{room.number}</span>
                {room.housekeeping && (
                  <span className="text-amber-500 text-xs" title="Cần dọn">🧹</span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 truncate mb-1.5">{room.roomType.name}</p>
              <span className={`text-[10px] font-semibold ${ds.text}`}>{ds.label}</span>
              {room.booking?.status === 'CHECKED_IN' && (
                <p className="text-[9px] text-slate-500 mt-1 truncate">{room.booking.user.name}</p>
              )}
              {room.booking?.status === 'CHECKED_IN' && (
                <p className="text-[9px] text-slate-400">→ {fmtDate(room.booking.checkOut)}</p>
              )}
              {room.booking?.status === 'CONFIRMED' && (
                <p className="text-[9px] text-blue-500 mt-1">CI: {fmtDate(room.booking.checkIn)}</p>
              )}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400 text-sm">Không có phòng nào phù hợp.</div>
      )}

      {/* Room detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
            {(() => {
              const ds = roomDisplayStatus(selected)
              return (
                <>
                  <div className={`${ds.bg} px-6 py-5 rounded-t-2xl flex items-center justify-between`}>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">{selected.roomType.name} · Tầng {selected.floor}</p>
                      <p className="text-2xl font-bold text-slate-800">Phòng {selected.number}</p>
                      <span className={`text-xs font-semibold ${ds.text}`}>{ds.label}</span>
                    </div>
                    <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-slate-600">✕</button>
                  </div>

                  <div className="p-6 space-y-4 text-sm">
                    {/* Booking info */}
                    {selected.booking && (
                      <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                        <p className="text-xs font-semibold text-slate-400 uppercase">Booking hiện tại</p>
                        <p className="font-bold text-emerald-700 font-mono">{selected.booking.code}</p>
                        <p className="font-medium text-slate-800">{selected.booking.user.name}</p>
                        {selected.booking.user.phone && <p className="text-slate-500">{selected.booking.user.phone}</p>}
                        <p className="text-slate-600">
                          {fmtDate(selected.booking.checkIn)} → {fmtDate(selected.booking.checkOut)}
                          · {selected.booking.guests} khách
                        </p>
                      </div>
                    )}

                    {/* Housekeeping */}
                    {selected.housekeeping && (
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs">
                        <p className="font-semibold text-amber-700 mb-1">Task housekeeping đang chờ</p>
                        <p className="text-amber-600">{selected.housekeeping.type} · {selected.housekeeping.priority} priority</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Đổi trạng thái phòng</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { status: 'AVAILABLE', label: 'Trống', color: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' },
                          { status: 'OCCUPIED', label: 'Có khách', color: 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' },
                          { status: 'MAINTENANCE', label: 'Bảo trì', color: 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200' },
                        ].map(opt => (
                          <button
                            key={opt.status}
                            disabled={selected.status === opt.status || updatingRoom === selected.id}
                            onClick={() => handleStatusChange(selected.id, opt.status)}
                            className={`border rounded-lg py-2 text-xs font-semibold transition-colors disabled:opacity-40 ${opt.color}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
