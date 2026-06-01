import { useEffect, useState } from 'react'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

type Shift = { id: string; startTime: string; endTime: string; area: string; notes: string | null }
type StaffMember = {
  id: string; name: string; email: string | null; phone: string | null
  role: string; shifts: Shift[]
}

const ROLE_META: Record<string, { label: string; color: string }> = {
  ADMIN:   { label: 'Admin',    color: 'bg-red-100 text-red-700' },
  MANAGER: { label: 'Quản lý', color: 'bg-violet-100 text-violet-700' },
  STAFF:   { label: 'Nhân viên', color: 'bg-sky-100 text-sky-700' },
}

const AREAS = ['reception', 'beach', 'restaurant', 'kitchen', 'spa', 'housekeeping', 'security']

function fmtTime(s: string) {
  return new Date(s).toLocaleString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', email: '', phone: '', role: 'STAFF' })
  const [addLoading, setAddLoading] = useState(false)

  // Shift modal
  const [shiftFor, setShiftFor] = useState<StaffMember | null>(null)
  const [shiftForm, setShiftForm] = useState({ startTime: '', endTime: '', area: 'reception', notes: '' })
  const [shiftLoading, setShiftLoading] = useState(false)

  function load() {
    fetch(`${BASE}/staff`)
      .then(r => r.json())
      .then((j: { data: StaffMember[] }) => setStaff(j.data))
      .catch(() => setError('Không kết nối được API.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleAddStaff() {
    if (!addForm.name || !addForm.email) return
    setAddLoading(true)
    try {
      const res = await fetch(`${BASE}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      })
      if (!res.ok) { const j = await res.json() as {error:string}; throw new Error(j.error) }
      setShowAdd(false)
      setAddForm({ name: '', email: '', phone: '', role: 'STAFF' })
      load()
    } catch (err) { alert(err instanceof Error ? err.message : 'Lỗi') }
    finally { setAddLoading(false) }
  }

  async function handleAddShift() {
    if (!shiftFor || !shiftForm.startTime || !shiftForm.endTime) return
    setShiftLoading(true)
    try {
      await fetch(`${BASE}/staff/shifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: shiftFor.id, ...shiftForm }),
      })
      setShiftFor(null)
      load()
    } catch { alert('Lỗi thêm ca') }
    finally { setShiftLoading(false) }
  }

  async function handleDeleteShift(id: string) {
    if (!confirm('Xóa ca trực này?')) return
    await fetch(`${BASE}/staff/shifts/${id}`, { method: 'DELETE' })
    load()
  }

  const Field = ({ label, value, onChange, type = 'text', placeholder = '' }: {
    label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
  }) => (
    <label className="block">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">{label}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
    </label>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Lora, serif' }}>
          Quản lý Nhân viên
        </h2>
        <button onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors">
          + Thêm nhân viên
        </button>
      </div>

      {error && <div className="mb-5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm">⚠️ {error}</div>}

      {/* Add staff modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h3 className="font-semibold text-slate-900">Thêm nhân viên mới</h3>
            <Field label="Họ tên *" value={addForm.name} onChange={v => setAddForm(p => ({...p, name: v}))} placeholder="Nguyễn Văn A" />
            <Field label="Email *" value={addForm.email} onChange={v => setAddForm(p => ({...p, email: v}))} type="email" placeholder="staff@resort.vn" />
            <Field label="Điện thoại" value={addForm.phone} onChange={v => setAddForm(p => ({...p, phone: v}))} type="tel" placeholder="0901..." />
            <label className="block">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Vai trò</span>
              <select value={addForm.role} onChange={e => setAddForm(p => ({...p, role: e.target.value}))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50">
                <option value="STAFF">Nhân viên</option>
                <option value="MANAGER">Quản lý</option>
              </select>
            </label>
            <p className="text-xs text-slate-400">Mật khẩu mặc định: <code>TramHuong@2026</code></p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 border-2 border-slate-200 text-slate-600 font-semibold rounded-xl text-sm">Hủy</button>
              <button onClick={handleAddStaff} disabled={addLoading}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm disabled:opacity-50">
                {addLoading ? 'Đang lưu...' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add shift modal */}
      {shiftFor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h3 className="font-semibold text-slate-900">Thêm ca — {shiftFor.name}</h3>
            <label className="block">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Bắt đầu</span>
              <input type="datetime-local" value={shiftForm.startTime} onChange={e => setShiftForm(p => ({...p, startTime: e.target.value}))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Kết thúc</span>
              <input type="datetime-local" value={shiftForm.endTime} onChange={e => setShiftForm(p => ({...p, endTime: e.target.value}))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Khu vực</span>
              <select value={shiftForm.area} onChange={e => setShiftForm(p => ({...p, area: e.target.value}))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50">
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
            <Field label="Ghi chú" value={shiftForm.notes} onChange={v => setShiftForm(p => ({...p, notes: v}))} placeholder="Tùy chọn" />
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShiftFor(null)} className="flex-1 py-2.5 border-2 border-slate-200 text-slate-600 font-semibold rounded-xl text-sm">Hủy</button>
              <button onClick={handleAddShift} disabled={shiftLoading}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm disabled:opacity-50">
                {shiftLoading ? '...' : 'Lưu ca'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16 text-slate-400 text-sm gap-3">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>Đang tải...
        </div>
      ) : (
        <div className="space-y-4">
          {staff.map(member => {
            const meta = ROLE_META[member.role] ?? { label: member.role, color: 'bg-slate-100 text-slate-600' }
            return (
              <div key={member.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between gap-4 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-lg font-semibold text-emerald-700">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{member.name}</p>
                      <p className="text-xs text-slate-400">{member.email} {member.phone ? `· ${member.phone}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${meta.color}`}>{meta.label}</span>
                    <button onClick={() => setShiftFor(member)}
                      className="text-xs px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg transition-colors">
                      + Ca trực
                    </button>
                  </div>
                </div>
                {member.shifts.length > 0 && (
                  <div className="px-5 py-3">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Ca trực gần đây</p>
                    <div className="space-y-1.5">
                      {member.shifts.map(shift => (
                        <div key={shift.id} className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">
                            <span className="font-semibold text-slate-700">{shift.area}</span>
                            {' · '}{fmtTime(shift.startTime)} → {new Date(shift.endTime).toLocaleTimeString('vi-VN', {hour:'2-digit',minute:'2-digit'})}
                          </span>
                          <button onClick={() => handleDeleteShift(shift.id)}
                            className="text-slate-300 hover:text-red-400 transition-colors ml-2">✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
