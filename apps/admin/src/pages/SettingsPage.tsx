import { useEffect, useState } from 'react'
import { api } from '../lib/api'

type SettingGroup = {
  title: string
  icon: string
  keys: { key: string; label: string; type: 'text' | 'number' | 'time' | 'textarea' | 'toggle' | 'select'; options?: string[]; description?: string }[]
}

const GROUPS: SettingGroup[] = [
  {
    title: 'Vận hành', icon: '⏰',
    keys: [
      { key: 'checkin_time', label: 'Giờ check-in', type: 'time' },
      { key: 'checkout_time', label: 'Giờ check-out', type: 'time' },
      { key: 'deposit_percent', label: 'Tỉ lệ đặt cọc (%)', type: 'number', description: 'Phần trăm thanh toán khi đặt phòng (VNPay)' },
      { key: 'max_guests_per_room', label: 'Số khách tối đa / phòng', type: 'number' },
      { key: 'checkin_open', label: 'Cho phép đặt phòng online', type: 'toggle' },
    ],
  },
  {
    title: 'Chính sách huỷ', icon: '📋',
    keys: [
      { key: 'cancel_full_refund_hours', label: 'Hoàn 100% (giờ trước check-in)', type: 'number', description: 'Huỷ trước X giờ → hoàn 100%' },
      { key: 'cancel_half_refund_hours', label: 'Hoàn 50% (giờ trước check-in)', type: 'number', description: 'Huỷ trước X giờ → hoàn 50%' },
    ],
  },
  {
    title: 'Thông tin resort', icon: '🏡',
    keys: [
      { key: 'resort_name', label: 'Tên resort', type: 'text' },
      { key: 'resort_phone', label: 'Số điện thoại', type: 'text' },
      { key: 'resort_email', label: 'Email', type: 'text' },
    ],
  },
  {
    title: 'Thông báo khách', icon: '📢',
    keys: [
      { key: 'notice_banner', label: 'Banner thông báo (web)', type: 'textarea', description: 'Để trống để ẩn banner. Hiện trên đầu website.' },
    ],
  },
  {
    title: 'Realtime', icon: '📡',
    keys: [
      { key: 'crowd_level', label: 'Mức độ đông đúc', type: 'select', options: ['LOW', 'MEDIUM', 'HIGH', 'FULL'] },
    ],
  },
]

function SettingInput({ value, onChange, type, options }: {
  value: string; onChange: (v: string) => void
  type: SettingGroup['keys'][0]['type']; options?: string[]
}) {
  if (type === 'toggle') {
    const on = value === 'true'
    return (
      <button onClick={() => onChange(on ? 'false' : 'true')}
        className={`relative w-12 h-6 rounded-full transition-colors ${on ? 'bg-emerald-500' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'left-6' : 'left-0.5'}`} />
      </button>
    )
  }
  if (type === 'textarea') {
    return (
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={3}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400" />
    )
  }
  if (type === 'select' && options) {
    return (
      <select value={value} onChange={e => onChange(e.target.value)}
        className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  }
  return (
    <input type={type === 'number' ? 'number' : type === 'time' ? 'time' : 'text'}
      value={value} onChange={e => onChange(e.target.value)}
      className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
  )
}

export function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.getSettings().then(s => { setSettings(s); setLoading(false) })
  }, [])

  const update = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const save = async () => {
    setSaving(true)
    await api.updateSettings(settings)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return <div className="text-center text-slate-400 py-16">Đang tải...</div>

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Lora, serif' }}>Cài đặt hệ thống</h2>
        <button onClick={save} disabled={saving}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
            saved ? 'bg-emerald-500 text-white' : 'bg-[#1B4332] text-white hover:bg-[#2D6A4F]'
          } disabled:opacity-50`}>
          {saving ? 'Đang lưu...' : saved ? '✓ Đã lưu' : 'Lưu thay đổi'}
        </button>
      </div>

      <div className="space-y-6">
        {GROUPS.map(group => (
          <div key={group.title} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 border-b border-slate-100">
              <span>{group.icon}</span>
              <span className="font-semibold text-slate-700">{group.title}</span>
            </div>
            <div className="divide-y divide-slate-50">
              {group.keys.map(item => (
                <div key={item.key} className="flex items-start gap-4 px-5 py-4">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-700">{item.label}</div>
                    {item.description && <div className="text-xs text-slate-400 mt-0.5">{item.description}</div>}
                  </div>
                  <div className="flex-shrink-0">
                    <SettingInput
                      value={settings[item.key] ?? ''}
                      onChange={v => update(item.key, v)}
                      type={item.type}
                      options={item.options}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Push notification */}
      <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 border-b border-slate-100">
          <span>🔔</span>
          <span className="font-semibold text-slate-700">Gửi thông báo push</span>
        </div>
        <PushNotificationPanel />
      </div>
    </div>
  )
}

function PushNotificationPanel() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [target, setTarget] = useState('ALL')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState('')

  const send = async () => {
    if (!title || !message) return
    setSending(true)
    const res = await api.sendNotification({ roles: [target], title, message })
    setSending(false)
    setResult(`Đã gửi đến ${res.sent} thiết bị`)
    setTitle('')
    setMessage('')
    setTimeout(() => setResult(''), 3000)
  }

  return (
    <div className="p-5 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-600">Gửi đến</label>
          <select value={target} onChange={e => setTarget(e.target.value)}
            className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option value="ALL">Tất cả</option>
            <option value="GUEST">Khách hàng</option>
            <option value="STAFF">Nhân viên</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">Tiêu đề</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Tiêu đề thông báo"
            className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600">Nội dung</label>
        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2}
          placeholder="Nội dung thông báo..." className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" />
      </div>
      <div className="flex items-center gap-3">
        <button onClick={send} disabled={sending || !title || !message}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
          {sending ? 'Đang gửi...' : 'Gửi ngay'}
        </button>
        {result && <span className="text-sm text-emerald-600 font-medium">{result}</span>}
      </div>
    </div>
  )
}
