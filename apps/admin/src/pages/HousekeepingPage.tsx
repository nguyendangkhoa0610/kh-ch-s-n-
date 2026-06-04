import { useEffect, useState, useCallback } from 'react'
import { api, type HousekeepingTask, type Staff } from '../lib/api'

const TYPE_LABEL: Record<string, string> = {
  CHECKOUT: 'Check-out', STAYOVER: 'Đang lưu trú', INSPECTION: 'Kiểm tra', DEEP_CLEAN: 'Vệ sinh sâu',
}
const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-emerald-100 text-emerald-700',
  SKIPPED: 'bg-slate-100 text-slate-500',
}
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ', IN_PROGRESS: 'Đang làm', DONE: 'Xong', SKIPPED: 'Bỏ qua',
}
const PRIORITY_COLOR: Record<string, string> = {
  LOW: 'text-slate-400', NORMAL: 'text-blue-500', HIGH: 'text-orange-500', URGENT: 'text-red-600',
}
const PRIORITY_LABEL: Record<string, string> = {
  LOW: 'Thấp', NORMAL: 'Bình thường', HIGH: 'Cao', URGENT: 'Khẩn',
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export function HousekeepingPage() {
  const [tasks, setTasks] = useState<HousekeepingTask[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [date, setDate] = useState(today())
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [generating, setGenerating] = useState(false)

  const [form, setForm] = useState({
    roomId: '', type: 'CHECKOUT', priority: 'NORMAL', assignedToId: '', notes: '', scheduledFor: today(),
  })

  const [rooms, setRooms] = useState<{ id: string; number: string; roomType: { name: string }; tasks: HousekeepingTask[] }[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    const [t, s, r] = await Promise.all([
      api.getHousekeepingTasks(date, statusFilter || undefined),
      api.getStaffList(),
      api.getRoomsStatus(),
    ])
    setTasks(t)
    setStaff(s.filter(u => u.role === 'STAFF' || u.role === 'MANAGER'))
    setRooms(r)
    setLoading(false)
  }, [date, statusFilter])

  useEffect(() => { load() }, [load])

  const updateTask = async (id: string, data: { status?: string; assignedToId?: string; priority?: string }) => {
    await api.updateHousekeepingTask(id, data)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
  }

  const createTask = async () => {
    if (!form.roomId) return
    const task = await api.createHousekeepingTask({
      roomId: form.roomId,
      type: form.type,
      priority: form.priority,
      assignedToId: form.assignedToId || undefined,
      notes: form.notes || undefined,
      scheduledFor: form.scheduledFor,
    })
    setTasks(prev => [task, ...prev])
    setShowCreate(false)
    setForm({ roomId: '', type: 'CHECKOUT', priority: 'NORMAL', assignedToId: '', notes: '', scheduledFor: today() })
  }

  const autoGenerate = async () => {
    setGenerating(true)
    const res = await api.autoGenerateHousekeeping()
    await load()
    setGenerating(false)
    alert(`Đã tạo ${res.count} task dọn phòng cho hôm nay`)
  }

  const exportCSV = () => {
    const token = (window as any).__AUTH_TOKEN__
    window.open(`${import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'}/export/housekeeping?date=${date}`, '_blank')
  }

  const done = tasks.filter(t => t.status === 'DONE').length
  const total = tasks.length

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Lora, serif' }}>Housekeeping</h2>
          <p className="text-sm text-slate-500 mt-1">
            {done}/{total} phòng hoàn thành
            {total > 0 && <span className="ml-2 text-emerald-600 font-semibold">{Math.round(done / total * 100)}%</span>}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button onClick={autoGenerate} disabled={generating}
            className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50">
            {generating ? 'Đang tạo...' : '⚡ Tự động tạo'}
          </button>
          <button onClick={exportCSV}
            className="px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">
            ↓ Xuất CSV
          </button>
          <button onClick={() => setShowCreate(true)}
            className="px-4 py-2 text-sm bg-[#1B4332] text-white rounded-lg hover:bg-[#2D6A4F]">
            + Tạo task
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="h-2 bg-slate-100 rounded-full mb-6 overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${Math.round(done / total * 100)}%` }} />
        </div>
      )}

      {/* Task list */}
      {loading ? (
        <div className="text-center text-slate-400 py-16">Đang tải...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center text-slate-400 py-16">
          <div className="text-4xl mb-3">🧹</div>
          <div>Chưa có task nào cho ngày này</div>
          <button onClick={autoGenerate}
            className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600">
            Tự động tạo từ check-out hôm nay
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <div key={task.id}
              className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4 shadow-sm">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-800">Phòng {task.room.number}</span>
                  <span className="text-xs text-slate-500">{task.room.roomType.name}</span>
                  <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    {TYPE_LABEL[task.type]}
                  </span>
                  <span className={`text-xs font-bold ${PRIORITY_COLOR[task.priority]}`}>
                    ● {PRIORITY_LABEL[task.priority]}
                  </span>
                </div>
                {task.notes && <p className="text-xs text-slate-500 mt-1">{task.notes}</p>}
                <div className="flex items-center gap-3 mt-2">
                  <select
                    value={task.assignedTo?.id ?? ''}
                    onChange={e => updateTask(task.id, { assignedToId: e.target.value || undefined })}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1"
                  >
                    <option value="">Chưa phân công</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <select
                  value={task.status}
                  onChange={e => updateTask(task.id, { status: e.target.value })}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border-0 cursor-pointer ${STATUS_COLOR[task.status]}`}
                >
                  {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg mb-4">Tạo Task Dọn Phòng</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Phòng *</label>
                <select value={form.roomId} onChange={e => setForm(f => ({ ...f, roomId: e.target.value }))}
                  className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm">
                  <option value="">Chọn phòng</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>Phòng {r.number} — {r.roomType.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Loại</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm">
                    {Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Ưu tiên</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm">
                    {Object.entries(PRIORITY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Phân công</label>
                <select value={form.assignedToId} onChange={e => setForm(f => ({ ...f, assignedToId: e.target.value }))}
                  className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm">
                  <option value="">Chưa phân công</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Ngày</label>
                <input type="date" value={form.scheduledFor}
                  onChange={e => setForm(f => ({ ...f, scheduledFor: e.target.value }))}
                  className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Ghi chú</label>
                <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Ghi chú thêm..."
                  className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowCreate(false)}
                className="flex-1 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">
                Huỷ
              </button>
              <button onClick={createTask} disabled={!form.roomId}
                className="flex-1 py-2 text-sm bg-[#1B4332] text-white rounded-lg hover:bg-[#2D6A4F] disabled:opacity-50">
                Tạo task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
