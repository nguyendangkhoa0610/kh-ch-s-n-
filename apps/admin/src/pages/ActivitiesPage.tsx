import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'

type Activity = {
  id: string; slug: string; name: string; description: string
  price: number; duration: number; maxSlots: number
  category: string; isActive: boolean; images: string
}

const CAT_LABELS: Record<string, string> = {
  water: '🌊 Dưới nước', land: '🌿 Trên bờ',
  wellness: '🧘 Sức khoẻ', food: '🍽 Ẩm thực',
}
const CATEGORIES = ['water', 'land', 'wellness', 'food']

function fmt(n: number) {
  if (n === 0) return 'Miễn phí'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}
function dur(m: number) {
  return m < 60 ? `${m} phút` : `${Math.floor(m / 60)}h${m % 60 ? m % 60 : ''}`
}

// ── Edit Modal ─────────────────────────────────────────────────────────────
function EditModal({ act, onClose, onSave }: {
  act: Activity
  onClose: () => void
  onSave: (id: string, data: Partial<Activity> & { images?: string[] }) => Promise<void>
}) {
  const parseImgs = (s: string) => { try { const a = JSON.parse(s) as string[]; return [a[0]??'', a[1]??'', a[2]??''] } catch { return ['','',''] } }
  const [form, setForm] = useState({
    name: act.name, description: act.description,
    price: String(act.price), duration: String(act.duration),
    maxSlots: String(act.maxSlots), category: act.category,
  })
  const [images, setImages] = useState<string[]>(parseImgs(act.images))
  const [tab, setTab] = useState<'info'|'images'>('info')
  const [saving, setSaving] = useState(false)

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(act.id, {
        ...form,
        price: Number(form.price),
        duration: Number(form.duration),
        maxSlots: Number(form.maxSlots),
        images: images.map(u => u.trim()).filter(Boolean),
      })
      onClose()
    } catch { alert('Lưu thất bại.') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">{act.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Thay đổi cập nhật ngay trên website</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">✕</button>
        </div>

        <div className="flex border-b border-slate-100 px-6">
          {(['info','images'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${tab===t ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              {t === 'info' ? 'Thông tin' : 'Hình ảnh'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <F label="Tên hoạt động" value={form.name} onChange={v => set('name', v)} />
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Danh mục</label>
                  <select value={form.category} onChange={e => set('category', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Mô tả</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <F label="Giá (VNĐ)" value={form.price} onChange={v => set('price', v)} type="number" />
                <F label="Thời gian (phút)" value={form.duration} onChange={v => set('duration', v)} type="number" />
                <F label="Số lượng tối đa" value={form.maxSlots} onChange={v => set('maxSlots', v)} type="number" />
              </div>
            </div>
          )}
          {tab === 'images' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">Paste URL ảnh từ Google Drive, Cloudinary, Unsplash...</p>
              {[0,1,2].map(i => (
                <div key={i}>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    {i===0 ? 'Ảnh chính *' : `Ảnh phụ ${i}`}
                    {images[i] && <span className="ml-2 font-normal text-emerald-600">✓</span>}
                  </label>
                  <div className="flex gap-2">
                    <input type="url" value={images[i]} onChange={e => { const n=[...images]; n[i]=e.target.value; setImages(n) }}
                      placeholder="https://..." className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    {images[i] && <a href={images[i]} target="_blank" rel="noopener noreferrer" className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-500">Xem</a>}
                  </div>
                  {images[i] && <img src={images[i]} alt="" className="mt-2 h-16 w-full object-cover rounded-lg" onError={e => (e.currentTarget.style.display='none')} />}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 font-medium">Hủy</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors">
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  )
}

function F({ label, value, onChange, type='text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────
export function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [editing, setEditing] = useState<Activity | null>(null)
  const [error, setError] = useState('')
  const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

  useEffect(() => {
    fetch(`${BASE}/activities?all=true`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((j: { data: Activity[] }) => setActivities(j.data ?? []))
      .catch(() => setError('Không kết nối được API.'))
      .finally(() => setLoading(false))
  }, [])

  async function toggleActive(act: Activity) {
    setUpdating(act.id)
    try {
      await api.toggleActivity(act.id, !act.isActive)
      setActivities(prev => prev.map(a => a.id === act.id ? { ...a, isActive: !a.isActive } : a))
    } catch { alert('Cập nhật thất bại.') }
    finally { setUpdating(null) }
  }

  async function saveActivity(id: string, data: Partial<Activity> & { images?: string[] }) {
    const res = await fetch(`${BASE}/activities/${id}`, {
      method: 'PATCH',
      headers: useAuth.getState().getHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json() as { data: Activity }
    setActivities(prev => prev.map(a => a.id === id ? json.data : a))
  }

  const byCategory = activities.reduce<Record<string, Activity[]>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = []
    acc[a.category].push(a)
    return acc
  }, {})

  return (
    <div>
      {editing && <EditModal act={editing} onClose={() => setEditing(null)} onSave={saveActivity as never} />}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Lora, serif' }}>Quản lý Hoạt động</h2>
        <span className="text-sm text-slate-400">{activities.length} hoạt động · {activities.filter(a => a.isActive).length} đang hoạt động</span>
      </div>

      {error && <div className="mb-5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm">⚠️ {error}</div>}

      {loading ? (
        <div className="flex justify-center py-16 text-slate-400 text-sm gap-3">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Đang tải...
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byCategory).map(([cat, acts]) => (
            <div key={cat} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
                <h3 className="font-semibold text-slate-700 text-sm">{CAT_LABELS[cat] ?? cat} · {acts.length} hoạt động</h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-50">
                    {['Tên','Giá','Thời gian','Slots','Trạng thái',''].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {acts.map(act => (
                    <tr key={act.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800 text-sm">{act.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{fmt(act.price)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{dur(act.duration)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{act.maxSlots}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${act.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {act.isActive ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditing(act)}
                            className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors">
                            Chỉnh sửa
                          </button>
                          <button disabled={updating === act.id} onClick={() => toggleActive(act)}
                            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-50 ${act.isActive ? 'bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'}`}>
                            {updating === act.id ? '...' : act.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
