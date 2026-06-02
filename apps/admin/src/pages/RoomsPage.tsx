import { useEffect, useState } from 'react'
import { api, type Room, type RoomType } from '../lib/api'

const STATUS_META = {
  AVAILABLE:   { label: 'Trống',    color: 'bg-emerald-500', badge: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  OCCUPIED:    { label: 'Có khách', color: 'bg-amber-400',   badge: 'bg-amber-50 border-amber-200 text-amber-700' },
  MAINTENANCE: { label: 'Bảo trì',  color: 'bg-slate-300',   badge: 'bg-slate-50 border-slate-200 text-slate-500' },
} as const
type RoomStatus = keyof typeof STATUS_META

// ── Edit Modal ─────────────────────────────────────────────────────────────
function EditRoomTypeModal({ roomType, onClose, onSave }: {
  roomType: RoomType
  onClose: () => void
  onSave: (id: string, data: Partial<RoomType> & { amenities?: string[]; images?: string[] }) => Promise<void>
}) {
  const parseJSON = (s: string, fallback: string[]) => { try { return JSON.parse(s) as string[] } catch { return fallback } }

  const [form, setForm] = useState({
    name: roomType.name,
    tagline: roomType.tagline,
    description: roomType.description,
    basePrice: String(roomType.basePrice),
    capacity: String(roomType.capacity),
    size: String(roomType.size),
    bedType: roomType.bedType,
    view: roomType.view,
    badge: roomType.badge ?? '',
  })
  const [amenities, setAmenities] = useState<string[]>(parseJSON(roomType.amenities, []))
  const [images, setImages] = useState<string[]>(() => {
    const imgs = parseJSON(roomType.images, [])
    return [imgs[0] ?? '', imgs[1] ?? '', imgs[2] ?? '']
  })
  const [tab, setTab] = useState<'info' | 'amenities' | 'images'>('info')
  const [saving, setSaving] = useState(false)

  function setField(k: keyof typeof form, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(roomType.id, {
        ...form,
        basePrice: Number(form.basePrice),
        capacity: Number(form.capacity),
        size: Number(form.size),
        badge: form.badge.trim() || null,
        amenities: amenities.filter(Boolean),
        images: images.map(u => u.trim()).filter(Boolean),
      })
      onClose()
    } catch { alert('Lưu thất bại, thử lại.') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Chỉnh sửa — {roomType.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Thay đổi sẽ hiển thị trên website ngay</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6">
          {(['info', 'amenities', 'images'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              {t === 'info' ? 'Thông tin' : t === 'amenities' ? 'Tiện nghi' : 'Hình ảnh'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Tên phòng *" value={form.name} onChange={v => setField('name', v)} />
                <Field label="Badge (VD: Phổ biến nhất)" value={form.badge} onChange={v => setField('badge', v)} placeholder="Để trống nếu không cần" />
              </div>
              <Field label="Tagline (câu ngắn)" value={form.tagline} onChange={v => setField('tagline', v)} placeholder="VD: Thức giấc cùng bình minh..." />
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Mô tả</label>
                <textarea value={form.description} onChange={e => setField('description', e.target.value)} rows={3}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Giá/đêm (VNĐ) *" value={form.basePrice} onChange={v => setField('basePrice', v)} type="number" />
                <Field label="Sức chứa (khách) *" value={form.capacity} onChange={v => setField('capacity', v)} type="number" />
                <Field label="Diện tích (m²) *" value={form.size} onChange={v => setField('size', v)} type="number" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Loại giường" value={form.bedType} onChange={v => setField('bedType', v)} placeholder="VD: Giường King" />
                <Field label="Tầm nhìn" value={form.view} onChange={v => setField('view', v)} placeholder="VD: Vịnh biển" />
              </div>
            </div>
          )}

          {tab === 'amenities' && (
            <div>
              <p className="text-xs text-slate-400 mb-4">Mỗi dòng một tiện nghi</p>
              <div className="space-y-2">
                {amenities.map((a, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={a} onChange={e => { const n = [...amenities]; n[i] = e.target.value; setAmenities(n) }}
                      placeholder={`Tiện nghi ${i + 1}`}
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    <button onClick={() => setAmenities(amenities.filter((_, j) => j !== i))}
                      className="px-2.5 text-slate-300 hover:text-red-400 transition-colors">✕</button>
                  </div>
                ))}
                <button onClick={() => setAmenities([...amenities, ''])}
                  className="w-full py-2 border border-dashed border-slate-300 rounded-xl text-sm text-slate-400 hover:text-slate-600 hover:border-slate-400 transition-colors">
                  + Thêm tiện nghi
                </button>
              </div>
            </div>
          )}

          {tab === 'images' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">Paste URL ảnh. Ảnh chính hiển thị ở listing và hero.</p>
              {[0, 1, 2].map(i => (
                <div key={i}>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    {i === 0 ? 'Ảnh chính *' : `Ảnh phụ ${i}`}
                    {images[i] && <span className="ml-2 font-normal text-emerald-600">✓</span>}
                  </label>
                  <div className="flex gap-2">
                    <input type="url" value={images[i]} onChange={e => { const n = [...images]; n[i] = e.target.value; setImages(n) }}
                      placeholder="https://..."
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    {images[i] && <a href={images[i]} target="_blank" rel="noopener noreferrer" className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-500 hover:text-slate-700">Xem</a>}
                  </div>
                  {images[i] && <img src={images[i]} alt="" className="mt-2 h-20 w-full object-cover rounded-lg" onError={e => (e.currentTarget.style.display = 'none')} />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 font-medium">Hủy</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors">
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [editingType, setEditingType] = useState<RoomType | null>(null)

  useEffect(() => {
    Promise.all([api.getRooms(), api.getRoomTypes()])
      .then(([r, t]) => { setRooms(r); setRoomTypes(t) })
      .catch(() => setError('Không kết nối được API.'))
      .finally(() => setLoading(false))
  }, [])

  async function setStatus(room: Room, status: RoomStatus) {
    if (room.status === status) return
    setUpdating(room.id)
    try {
      const updated = await api.updateRoomStatus(room.id, status)
      setRooms(prev => prev.map(r => r.id === updated.id ? updated : r))
    } catch { alert('Cập nhật thất bại.') }
    finally { setUpdating(null) }
  }

  async function saveRoomType(id: string, data: Parameters<typeof api.updateRoomType>[1]) {
    const updated = await api.updateRoomType(id, data)
    setRoomTypes(prev => prev.map(t => t.id === id ? updated : t))
  }

  const byType = rooms.reduce<Record<string, Room[]>>((acc, r) => {
    const key = r.roomType.name
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {})

  const summary = {
    total: rooms.length,
    available: rooms.filter(r => r.status === 'AVAILABLE').length,
    occupied: rooms.filter(r => r.status === 'OCCUPIED').length,
    maintenance: rooms.filter(r => r.status === 'MAINTENANCE').length,
  }

  return (
    <div>
      {editingType && (
        <EditRoomTypeModal roomType={editingType} onClose={() => setEditingType(null)} onSave={saveRoomType} />
      )}

      <h2 className="text-2xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Lora, serif' }}>Quản lý Phòng</h2>

      {error && <div className="mb-5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm">⚠️ {error}</div>}

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
          {Object.entries(byType).map(([typeName, typeRooms]) => {
            const dbType = roomTypes.find(t => t.name === typeName)
            const images: string[] = (() => { try { return JSON.parse(dbType?.images ?? '[]') } catch { return [] } })()

            return (
              <div key={typeName} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {images[0] ? (
                      <img src={images[0]} alt={typeName} className="w-12 h-12 rounded-lg object-cover border border-slate-100" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 text-xs">Chưa có ảnh</div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800">{typeName}</h3>
                        {dbType?.badge && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">{dbType.badge}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {typeRooms[0]?.roomType.capacity} khách · {new Intl.NumberFormat('vi-VN').format(typeRooms[0]?.roomType.basePrice ?? 0)} đ/đêm
                        · {typeRooms.length} phòng
                      </p>
                    </div>
                  </div>
                  {dbType && (
                    <button onClick={() => setEditingType(dbType)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                      </svg>
                      Chỉnh sửa
                    </button>
                  )}
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  {typeRooms.map(room => {
                    const meta = STATUS_META[room.status as RoomStatus]
                    return (
                      <div key={room.id} className={`rounded-xl border p-3 ${meta.badge}`}>
                        <p className="font-bold text-base mb-1">{room.number}</p>
                        <p className="text-[11px] font-medium mb-2">{meta.label}</p>
                        <select value={room.status} disabled={updating === room.id}
                          onChange={e => setStatus(room, e.target.value as RoomStatus)}
                          className="w-full text-[10px] border border-current/20 rounded-md px-1.5 py-1 bg-white/70 cursor-pointer disabled:opacity-50">
                          <option value="AVAILABLE">Trống</option>
                          <option value="OCCUPIED">Có khách</option>
                          <option value="MAINTENANCE">Bảo trì</option>
                        </select>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
