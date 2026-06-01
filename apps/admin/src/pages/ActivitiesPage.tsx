import { useEffect, useState } from 'react'
import { api } from '../lib/api'

type Activity = {
  id: string; slug: string; name: string; price: number
  duration: number; maxSlots: number; category: string; isActive: boolean
}

const CAT_LABELS: Record<string, string> = {
  water: '🌊 Dưới nước', land: '🌿 Trên bờ',
  wellness: '🧘 Sức khoẻ', food: '🍽 Ẩm thực',
}

function formatPrice(n: number) {
  if (n === 0) return 'Miễn phí'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}
function formatDuration(m: number) {
  return m < 60 ? `${m} phút` : `${Math.floor(m / 60)}h${m % 60 ? m % 60 : ''}`
}

export function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('http://localhost:4000/api/activities?all=true')
      .then((r) => r.json())
      .then((j: { data: Activity[] }) => setActivities(j.data))
      .catch(() => setError('Không kết nối được API.'))
      .finally(() => setLoading(false))
  }, [])

  async function toggleActive(act: Activity) {
    setUpdating(act.id)
    try {
      await api.toggleActivity(act.id, !act.isActive)
      setActivities((prev) => prev.map((a) => a.id === act.id ? { ...a, isActive: !a.isActive } : a))
    } catch { alert('Cập nhật thất bại.') }
    finally { setUpdating(null) }
  }

  const byCategory = activities.reduce<Record<string, Activity[]>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = []
    acc[a.category].push(a)
    return acc
  }, {})

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Lora, serif' }}>
          Quản lý Hoạt động
        </h2>
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
                    {['Tên', 'Giá', 'Thời gian', 'Max slots', 'Trạng thái', ''].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {acts.map((act) => (
                    <tr key={act.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800 text-sm">{act.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatPrice(act.price)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatDuration(act.duration)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{act.maxSlots} người</td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${act.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {act.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          disabled={updating === act.id}
                          onClick={() => toggleActive(act)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                            act.isActive
                              ? 'bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {updating === act.id ? '...' : act.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                        </button>
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
