import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../lib/auth'

type Alert = {
  id: string; type: string; message?: string | null; status: string
  location: string; createdAt: string
  user: { name: string; phone: string }
}

const TYPE_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  SOS:      { label: 'SOS Khẩn cấp', color: 'text-red-700',    bg: 'bg-red-50 border-red-200',    icon: '🆘' },
  INCIDENT: { label: 'Sự cố',        color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200', icon: '⚠️' },
  REQUEST:  { label: 'Yêu cầu',      color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',   icon: '📞' },
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return `${diff}s trước`
  if (diff < 3600) return `${Math.floor(diff/60)}p trước`
  return `${Math.floor(diff/3600)}h trước`
}

export function StaffAlertsPage() {
  const { getHeaders } = useAuth()
  const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const load = useCallback(() => {
    fetch(`${BASE}/mobile/staff/sos-alerts`, { headers: getHeaders() })
      .then(r => r.json())
      .then((j: { data: Alert[] }) => setAlerts(j.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 20000) // poll 20s
    return () => clearInterval(t)
  }, [load])

  async function updateStatus(id: string, status: 'RESPONDING' | 'RESOLVED') {
    setUpdating(id)
    try {
      await fetch(`${BASE}/mobile/staff/sos-alerts/${id}`, {
        method: 'PATCH', headers: getHeaders(),
        body: JSON.stringify({ status }),
      })
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    } catch { alert('Cập nhật thất bại.') }
    finally { setUpdating(null) }
  }

  const active = alerts.filter(a => a.status !== 'RESOLVED')
  const resolved = alerts.filter(a => a.status === 'RESOLVED')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Lora, serif' }}>SOS & Sự cố</h2>
        <div className="flex items-center gap-2">
          {active.length > 0 && <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />}
          <span className="text-sm text-slate-400">{active.length} đang xử lý</span>
          <button onClick={load} className="ml-2 text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100">↻ Tải lại</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-slate-400 text-sm gap-2">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Đang tải...
        </div>
      ) : active.length === 0 && resolved.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-slate-500">Không có cảnh báo nào. Tất cả ổn!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...active, ...resolved].map(alert => {
            const meta = TYPE_META[alert.type] ?? TYPE_META.INCIDENT
            const loc = (() => { try { return JSON.parse(alert.location)?.area ?? alert.location } catch { return alert.location } })()
            return (
              <div key={alert.id} className={`bg-white rounded-2xl border p-4 ${alert.status === 'RESOLVED' ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${meta.bg} ${meta.color}`}>{meta.label}</span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        alert.status === 'NEW' ? 'bg-red-100 text-red-700' :
                        alert.status === 'RESPONDING' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {alert.status === 'NEW' ? 'Mới' : alert.status === 'RESPONDING' ? 'Đang xử lý' : 'Đã giải quyết'}
                      </span>
                      <span className="text-xs text-slate-400">{timeAgo(alert.createdAt)}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 mt-1">{alert.user.name} · {alert.user.phone}</p>
                    <p className="text-xs text-slate-500">{loc}</p>
                    {alert.message && <p className="text-sm text-slate-600 mt-1">"{alert.message}"</p>}
                  </div>
                  {alert.status !== 'RESOLVED' && (
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {alert.status === 'NEW' && (
                        <button onClick={() => updateStatus(alert.id, 'RESPONDING')} disabled={updating === alert.id}
                          className="text-xs px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold rounded-lg transition-colors disabled:opacity-50">
                          Tiếp nhận
                        </button>
                      )}
                      <button onClick={() => updateStatus(alert.id, 'RESOLVED')} disabled={updating === alert.id}
                        className="text-xs px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold rounded-lg transition-colors disabled:opacity-50">
                        Đã xử lý
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
