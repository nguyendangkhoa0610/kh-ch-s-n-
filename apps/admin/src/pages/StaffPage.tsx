import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

type Shift = { id: string; startTime: string; endTime: string; area: string; notes: string | null }
type StaffMember = { id: string; name: string; email: string | null; phone: string | null; role: string; shifts: Shift[] }

const ROLE_META: Record<string, { label: string; color: string }> = {
  ADMIN:   { label: 'Admin',    color: 'bg-red-100 text-red-700' },
  MANAGER: { label: 'Quản lý', color: 'bg-violet-100 text-violet-700' },
  STAFF:   { label: 'Nhân viên', color: 'bg-sky-100 text-sky-700' },
}
const AREAS = ['reception', 'beach', 'restaurant', 'kitchen', 'spa', 'housekeeping', 'security', 'all']
const AREA_VI: Record<string, string> = {
  reception: 'Lễ tân', beach: 'Bãi biển', restaurant: 'Nhà hàng',
  kitchen: 'Bếp', spa: 'Spa', housekeeping: 'Buồng phòng', security: 'Bảo vệ', all: 'Toàn khu',
}

function fmtTime(s: string) {
  return new Date(s).toLocaleString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function F({ label, value, onChange, type = 'text', placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">{label}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
    </label>
  )
}

export function StaffPage() {
  const { getHeaders } = useAuth()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal states
  const [showAdd, setShowAdd] = useState(false)
  const [editMember, setEditMember] = useState<StaffMember | null>(null)
  const [resetPwdFor, setResetPwdFor] = useState<StaffMember | null>(null)
  const [shiftFor, setShiftFor] = useState<StaffMember | null>(null)

  // Form states
  const [addForm, setAddForm] = useState({ name: '', email: '', phone: '', role: 'STAFF', password: '' })
  const [editForm, setEditForm] = useState({ name: '', phone: '', role: 'STAFF' })
  const [newPwd, setNewPwd] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [shiftForm, setShiftForm] = useState({ startTime: '', endTime: '', area: 'reception', notes: '' })
  const [saving, setSaving] = useState(false)
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null)

  function load() {
    fetch(`${BASE_URL}/staff`, { headers: getHeaders() })
      .then(r => r.json())
      .then((j: { data: StaffMember[] }) => setStaff(j.data))
      .catch(() => setError('Không kết nối được API.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // ── Add staff ──────────────────────────────────────────────
  async function handleAdd() {
    if (!addForm.name.trim() || !addForm.email.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`${BASE_URL}/staff`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: addForm.name.trim(),
          email: addForm.email.trim(),
          phone: addForm.phone.trim() || undefined,
          role: addForm.role,
          password: addForm.password.trim() || undefined,
        }),
      })
      if (!res.ok) { const j = await res.json() as { error: string }; throw new Error(j.error) }
      const usedPwd = addForm.password.trim() || 'TramHuong@2026'
      setCreatedCreds({ email: addForm.email.trim(), password: usedPwd })
      setShowAdd(false)
      setAddForm({ name: '', email: '', phone: '', role: 'STAFF', password: '' })
      load()
    } catch (err) { alert(err instanceof Error ? err.message : 'Lỗi') }
    finally { setSaving(false) }
  }

  // ── Edit staff ─────────────────────────────────────────────
  function openEdit(m: StaffMember) {
    setEditForm({ name: m.name, phone: m.phone ?? '', role: m.role })
    setEditMember(m)
  }
  async function handleEdit() {
    if (!editMember) return
    setSaving(true)
    try {
      await fetch(`${BASE_URL}/staff/${editMember.id}`, {
        method: 'PATCH', headers: getHeaders(),
        body: JSON.stringify(editForm),
      })
      setEditMember(null)
      load()
    } catch { alert('Cập nhật thất bại.') }
    finally { setSaving(false) }
  }

  // ── Reset password ─────────────────────────────────────────
  async function handleResetPwd() {
    if (!resetPwdFor || !newPwd.trim()) return
    if (newPwd.trim().length < 6) return alert('Mật khẩu tối thiểu 6 ký tự')
    setSaving(true)
    try {
      await fetch(`${BASE_URL}/staff/${resetPwdFor.id}/password`, {
        method: 'PATCH', headers: getHeaders(),
        body: JSON.stringify({ password: newPwd.trim() }),
      })
      setCreatedCreds({ email: resetPwdFor.email ?? '', password: newPwd.trim() })
      setResetPwdFor(null)
      setNewPwd('')
    } catch { alert('Đặt lại thất bại.') }
    finally { setSaving(false) }
  }

  // ── Delete staff ───────────────────────────────────────────
  async function handleDelete(m: StaffMember) {
    if (!confirm(`Xóa tài khoản ${m.name}?\nHành động này không thể hoàn tác.`)) return
    try {
      const res = await fetch(`${BASE_URL}/staff/${m.id}`, { method: 'DELETE', headers: getHeaders() })
      if (!res.ok) { const j = await res.json() as { error: string }; throw new Error(j.error) }
      load()
    } catch (err) { alert(err instanceof Error ? err.message : 'Xóa thất bại') }
  }

  // ── Add shift ──────────────────────────────────────────────
  async function handleAddShift() {
    if (!shiftFor || !shiftForm.startTime || !shiftForm.endTime) return
    setSaving(true)
    try {
      await fetch(`${BASE_URL}/staff/shifts`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ staffId: shiftFor.id, ...shiftForm }),
      })
      setShiftFor(null)
      setShiftForm({ startTime: '', endTime: '', area: 'reception', notes: '' })
      load()
    } catch { alert('Lỗi thêm ca') }
    finally { setSaving(false) }
  }

  async function handleDeleteShift(id: string) {
    if (!confirm('Xóa ca trực này?')) return
    await fetch(`${BASE_URL}/staff/shifts/${id}`, { method: 'DELETE', headers: getHeaders() })
    load()
  }

  return (
    <div>
      {/* ── Credentials notice ── */}
      {createdCreds && (
        <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-emerald-800 mb-2">✅ Tài khoản đã sẵn sàng — gửi thông tin này cho nhân viên:</p>
              <div className="bg-white rounded-xl px-4 py-3 border border-emerald-200 space-y-1">
                <p className="text-sm">🌐 <span className="text-slate-500">Đường dẫn:</span> <span className="font-mono font-semibold text-slate-800">http://localhost:3001/login</span></p>
                <p className="text-sm">📧 <span className="text-slate-500">Email:</span> <span className="font-mono font-semibold text-slate-800">{createdCreds.email}</span></p>
                <p className="text-sm">🔑 <span className="text-slate-500">Mật khẩu:</span> <span className="font-mono font-semibold text-slate-800">{createdCreds.password}</span></p>
              </div>
            </div>
            <button onClick={() => setCreatedCreds(null)} className="text-emerald-600 hover:text-emerald-800 text-xl">✕</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Lora, serif' }}>Quản lý Nhân viên</h2>
        <button onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors">
          + Thêm nhân viên
        </button>
      </div>

      {error && <div className="mb-5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm">⚠️ {error}</div>}

      {/* ── Modal: Thêm nhân viên ── */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-900 text-lg">Thêm nhân viên mới</h3>
            <F label="Họ tên *" value={addForm.name} onChange={v => setAddForm(p => ({ ...p, name: v }))} placeholder="Nguyễn Văn A" />
            <F label="Email *" value={addForm.email} onChange={v => setAddForm(p => ({ ...p, email: v }))} type="email" placeholder="nv@tramhuong.vn" />
            <F label="Điện thoại" value={addForm.phone} onChange={v => setAddForm(p => ({ ...p, phone: v }))} type="tel" placeholder="0901..." />
            <label className="block">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Vai trò</span>
              <select value={addForm.role} onChange={e => setAddForm(p => ({ ...p, role: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50">
                <option value="STAFF">Nhân viên</option>
                <option value="MANAGER">Quản lý</option>
              </select>
            </label>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Mật khẩu</span>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} value={addForm.password}
                  onChange={e => setAddForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Để trống → dùng TramHuong@2026"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pr-11 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{showPwd ? '🙈' : '👁'}</button>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 border-2 border-slate-200 text-slate-600 font-semibold rounded-xl text-sm">Hủy</button>
              <button onClick={handleAdd} disabled={saving || !addForm.name || !addForm.email}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm disabled:opacity-50">
                {saving ? 'Đang lưu...' : 'Tạo tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Chỉnh sửa ── */}
      {editMember && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setEditMember(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-900 text-lg">Chỉnh sửa — {editMember.name}</h3>
            <F label="Họ tên" value={editForm.name} onChange={v => setEditForm(p => ({ ...p, name: v }))} />
            <F label="Điện thoại" value={editForm.phone} onChange={v => setEditForm(p => ({ ...p, phone: v }))} type="tel" />
            <label className="block">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Vai trò</span>
              <select value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50">
                <option value="STAFF">Nhân viên</option>
                <option value="MANAGER">Quản lý</option>
              </select>
            </label>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditMember(null)} className="flex-1 py-2.5 border-2 border-slate-200 text-slate-600 font-semibold rounded-xl text-sm">Hủy</button>
              <button onClick={handleEdit} disabled={saving}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm disabled:opacity-50">
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Đặt lại mật khẩu ── */}
      {resetPwdFor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setResetPwdFor(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-900 text-lg">Đặt lại mật khẩu</h3>
            <p className="text-sm text-slate-500">{resetPwdFor.name} · {resetPwdFor.email}</p>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Mật khẩu mới</span>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pr-11 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{showPwd ? '🙈' : '👁'}</button>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setResetPwdFor(null); setNewPwd('') }} className="flex-1 py-2.5 border-2 border-slate-200 text-slate-600 font-semibold rounded-xl text-sm">Hủy</button>
              <button onClick={handleResetPwd} disabled={saving || newPwd.length < 6}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-sm disabled:opacity-50">
                {saving ? '...' : 'Đặt lại'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Thêm ca ── */}
      {shiftFor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShiftFor(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-900 text-lg">Ca trực — {shiftFor.name}</h3>
            <label className="block">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Bắt đầu</span>
              <input type="datetime-local" value={shiftForm.startTime} onChange={e => setShiftForm(p => ({ ...p, startTime: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Kết thúc</span>
              <input type="datetime-local" value={shiftForm.endTime} onChange={e => setShiftForm(p => ({ ...p, endTime: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Khu vực</span>
              <select value={shiftForm.area} onChange={e => setShiftForm(p => ({ ...p, area: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50">
                {AREAS.map(a => <option key={a} value={a}>{AREA_VI[a] ?? a}</option>)}
              </select>
            </label>
            <F label="Ghi chú" value={shiftForm.notes} onChange={v => setShiftForm(p => ({ ...p, notes: v }))} placeholder="Tùy chọn" />
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShiftFor(null)} className="flex-1 py-2.5 border-2 border-slate-200 text-slate-600 font-semibold rounded-xl text-sm">Hủy</button>
              <button onClick={handleAddShift} disabled={saving}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm disabled:opacity-50">
                {saving ? '...' : 'Lưu ca'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── List ── */}
      {loading ? (
        <div className="flex justify-center py-16 text-slate-400 text-sm gap-3">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Đang tải...
        </div>
      ) : (
        <div className="space-y-4">
          {staff.map(member => {
            const meta = ROLE_META[member.role] ?? { label: member.role, color: 'bg-slate-100 text-slate-600' }
            const isAdmin = member.role === 'ADMIN'
            return (
              <div key={member.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-lg font-bold text-emerald-700">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900 text-sm">{member.name}</p>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {member.email}{member.phone ? ` · ${member.phone}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <button onClick={() => setShiftFor(member)}
                      className="text-xs px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg transition-colors">
                      + Ca trực
                    </button>
                    {!isAdmin && (
                      <>
                        <button onClick={() => openEdit(member)}
                          className="text-xs px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 font-semibold rounded-lg transition-colors">
                          Chỉnh sửa
                        </button>
                        <button onClick={() => { setResetPwdFor(member); setShowPwd(false); setNewPwd('') }}
                          className="text-xs px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold rounded-lg transition-colors">
                          Đặt lại MK
                        </button>
                        <button onClick={() => handleDelete(member)}
                          className="text-xs px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg transition-colors">
                          Xóa
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {member.shifts.length > 0 && (
                  <div className="px-5 pb-4 border-t border-slate-50 pt-3">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Ca trực gần đây</p>
                    <div className="space-y-1.5">
                      {member.shifts.map(shift => (
                        <div key={shift.id} className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">
                            <span className="font-semibold text-slate-700">{AREA_VI[shift.area] ?? shift.area}</span>
                            {' · '}{fmtTime(shift.startTime)} → {new Date(shift.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            {shift.notes && <span className="text-slate-400"> · {shift.notes}</span>}
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
