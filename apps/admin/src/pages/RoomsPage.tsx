import { useEffect, useState } from 'react'
import { api, type Room } from '../lib/api'

const STATUS_META = {
  AVAILABLE:   { label: 'Trống',     color: 'bg-emerald-500', badge: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  OCCUPIED:    { label: 'Có khách',  color: 'bg-amber-400',   badge: 'bg-amber-50 border-amber-200 text-amber-700' },
  MAINTENANCE: { label: 'Bảo trì',   color: 'bg-slate-300',   badge: 'bg-slate-50 border-slate-200 text-slate-500' },
} as const

type RoomStatus = keyof typeof STATUS_META

export function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    api.getRooms()
      .then(setRooms)
      .catch(() => setError('Không kết nối được API.'))
      .finally(() => setLoading(false))
  }, [])

  async function setStatus(room: Room, status: RoomStatus) {
    if (room.status === status) return
    setUpdating(room.id)
    try {
      const updated = await api.updateRoomStatus(room.id, status)
      setRooms((prev) => prev.map((r) => r.id === updated.id ? updated : r))
    } catch {
      alert('Cập nhật thất bại.')
    } finally {
      setUpdating(null)
    }
  }

  // Group by room type
  const byType = rooms.reduce<Record<string, Room[]>>((acc, r) => {
    const key = r.roomType.name
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {})

  const summary = {
    total: rooms.length,
    available: rooms.filter((r) => r.status === 'AVAILABLE').length,
    occupied: rooms.filter((r) => r.status === 'OCCUPIED').length,
    maintenance: rooms.filter((r) => r.status === 'MAINTENANCE').length,
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Lora, serif' }}>
        Quản lý Phòng
      </h2>

      {error && (
        <div className="mb-5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Summary */}
      <div className="flex flex-wrap gap-3 mb-8">
        {(Object.entries(STATUS_META) as [RoomStatus, typeof STATUS_META[RoomStatus]][]).map(([key, meta]) => (
          <div key={key} className="bg-white rounded-xl px-4 py-3 shadow-sm border border-slate-100 flex items-center gap-2.5">
            <span className={`w-3 h-3 rounded-full ${meta.color}`} />
            <span className="text-sm font-medium text-slate-700">{meta.label}</span>
            <span className="text-sm font-bold text-slate-900">
              {key === 'AVAILABLE' ? summary.available : key === 'OCCUPIED' ? summary.occupied : summary.maintenance}
            </span>
            <span className="text-xs text-slate-400">/ {summary.total}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400 text-sm gap-3">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Đang tải...
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byType).map(([typeName, typeRooms]) => (
            <div key={typeName} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">{typeName}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {typeRooms[0]?.roomType.capacity} khách · {new Intl.NumberFormat('vi-VN').format(typeRooms[0]?.roomType.basePrice ?? 0)} đ/đêm
                  </p>
                </div>
                <span className="text-xs text-slate-400">{typeRooms.length} phòng</span>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {typeRooms.map((room) => {
                  const meta = STATUS_META[room.status as RoomStatus]
                  return (
                    <div key={room.id} className={`rounded-xl border p-3 ${meta.badge}`}>
                      <p className="font-bold text-base mb-1">{room.number}</p>
                      <p className="text-[11px] font-medium mb-2">{meta.label}</p>
                      {/* Quick action */}
                      <select
                        value={room.status}
                        disabled={updating === room.id}
                        onChange={(e) => setStatus(room, e.target.value as RoomStatus)}
                        className="w-full text-[10px] border border-current/20 rounded-md px-1.5 py-1 bg-white/70 cursor-pointer disabled:opacity-50"
                      >
                        <option value="AVAILABLE">Trống</option>
                        <option value="OCCUPIED">Có khách</option>
                        <option value="MAINTENANCE">Bảo trì</option>
                      </select>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
