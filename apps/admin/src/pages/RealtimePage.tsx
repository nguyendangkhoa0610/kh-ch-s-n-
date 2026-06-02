import { useEffect, useState } from 'react'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

type CrowdLevel = 'LOW' | 'MEDIUM' | 'HIGH'
type Settings = { crowdLevel: CrowdLevel; notice: string; updatedAt: string; updatedBy: string }

const CROWD_OPTIONS: { id: CrowdLevel; label: string; desc: string; color: string; dot: string }[] = [
  { id: 'LOW',    label: 'Thoáng',    desc: 'Resort có ít khách, không cần xếp hàng', color: 'border-emerald-500 bg-emerald-50', dot: 'bg-emerald-500' },
  { id: 'MEDIUM', label: 'Vừa phải', desc: 'Đông bình thường, dịch vụ vẫn nhanh',    color: 'border-amber-500 bg-amber-50',   dot: 'bg-amber-500' },
  { id: 'HIGH',   label: 'Đông',     desc: 'Resort khá đông, khách nên đặt trước',    color: 'border-red-400 bg-red-50',       dot: 'bg-red-400' },
]

export function RealtimePage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [localCrowd, setLocalCrowd] = useState<CrowdLevel>('LOW')
  const [localNotice, setLocalNotice] = useState('')

  function load() {
    fetch(`${BASE}/staff/realtime`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then((j: { data: Settings }) => {
        setSettings(j.data)
        setLocalCrowd(j.data.crowdLevel)
        setLocalNotice(j.data.notice)
      })
      .catch(() => {})
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      await fetch(`${BASE}/staff/realtime`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crowdLevel: localCrowd, notice: localNotice }),
      })
      setSaved(true)
      load()
      setTimeout(() => setSaved(false), 3000)
    } catch { alert('Lỗi lưu') }
    finally { setSaving(false) }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Lora, serif' }}>
          Cập nhật Real-time
        </h2>
        {settings && (
          <p className="text-xs text-slate-400">
            Cập nhật lúc {new Date(settings.updatedAt).toLocaleTimeString('vi-VN')}
          </p>
        )}
      </div>

      <div className="space-y-5">
        {/* Crowd level */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-1">Mức độ đông của resort</h3>
          <p className="text-sm text-slate-500 mb-5">
            Hiển thị trên thanh real-time của website khách hàng.
          </p>
          <div className="space-y-3">
            {CROWD_OPTIONS.map(opt => (
              <button key={opt.id} onClick={() => setLocalCrowd(opt.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                  localCrowd === opt.id ? opt.color : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}>
                <span className={`w-4 h-4 rounded-full shrink-0 ${opt.dot}`} />
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{opt.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                </div>
                {localCrowd === opt.id && (
                  <span className="ml-auto text-emerald-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notice */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-1">Thông báo khẩn</h3>
          <p className="text-sm text-slate-500 mb-4">
            Hiển thị trên thanh real-time nếu có nội dung. Để trống để tắt.
          </p>
          <textarea
            value={localNotice}
            onChange={e => setLocalNotice(e.target.value)}
            rows={3}
            maxLength={200}
            placeholder="VD: Bãi biển tạm đóng 15:00–17:00 do sóng lớn. Khách vui lòng sử dụng hồ bơi chính..."
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 resize-none"
          />
          <p className="text-xs text-slate-400 mt-1.5 text-right">{localNotice.length}/200</p>
        </div>

        {/* Preview */}
        <div className="bg-slate-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Preview thanh real-time</p>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-4 text-sm">
            <span className="text-slate-400">☀️ 26°C · Mưa phùn</span>
            <span className="w-px h-4 bg-slate-200" />
            <span className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                localCrowd === 'LOW' ? 'bg-emerald-400' : localCrowd === 'MEDIUM' ? 'bg-amber-400' : 'bg-red-400'
              }`} />
              <span className="text-slate-600">
                Resort: <span className={`font-semibold ${
                  localCrowd === 'LOW' ? 'text-emerald-700' : localCrowd === 'MEDIUM' ? 'text-amber-700' : 'text-red-700'
                }`}>
                  {CROWD_OPTIONS.find(o => o.id === localCrowd)?.label}
                </span>
              </span>
            </span>
            {localNotice && (
              <>
                <span className="w-px h-4 bg-slate-200" />
                <span className="text-amber-700 font-medium truncate">📢 {localNotice}</span>
              </>
            )}
          </div>
        </div>

        {/* Save */}
        <button onClick={handleSave} disabled={saving}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
          {saving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Đang lưu...
            </>
          ) : saved ? '✅ Đã cập nhật!' : '💾 Lưu & áp dụng ngay'}
        </button>
      </div>
    </div>
  )
}
