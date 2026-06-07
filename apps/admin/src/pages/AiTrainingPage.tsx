import { useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'

type AiFeedback = {
  id: string
  question: string
  aiAnswer: string
  isGood: boolean
  correction: string | null
  addedToKb: boolean
  createdAt: string
}

type KnowledgeEntry = {
  id: string
  title: string
  content: string
  category: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

type Stats = {
  total: number
  good: number
  bad: number
  satisfactionRate: number
  addedToKb: number
  kbCount: number
  recentQuestions: { question: string; isGood: boolean }[]
}

const CATEGORIES = ['FAQ', 'ROOMS', 'SERVICES', 'POLICY', 'DINING']
const CAT_LABEL: Record<string, string> = {
  FAQ: 'FAQ chung', ROOMS: 'Phòng', SERVICES: 'Dịch vụ', POLICY: 'Chính sách', DINING: 'Ẩm thực',
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function AiTrainingPage() {
  const [tab, setTab] = useState<'feedback' | 'kb' | 'stats'>('feedback')

  // Feedback tab
  const [feedbacks, setFeedbacks] = useState<AiFeedback[]>([])
  const [fbFilter, setFbFilter] = useState<'all' | 'good' | 'bad'>('all')
  const [fbLoading, setFbLoading] = useState(true)
  const [addingToKb, setAddingToKb] = useState<string | null>(null)

  // KB tab
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [kbLoading, setKbLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [editEntry, setEditEntry] = useState<KnowledgeEntry | null>(null)
  const [kbForm, setKbForm] = useState({ title: '', content: '', category: 'FAQ' })
  const [kbSaving, setKbSaving] = useState(false)

  // Stats tab
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  const loadFeedback = useCallback(async () => {
    setFbLoading(true)
    try {
      const filter = fbFilter !== 'all' ? `?filter=${fbFilter}` : ''
      const data = await api.get<AiFeedback[]>(`/ai/feedback${filter}`)
      setFeedbacks(data)
    } catch { /* ignore */ } finally { setFbLoading(false) }
  }, [fbFilter])

  const loadKb = useCallback(async () => {
    setKbLoading(true)
    try {
      const data = await api.get<KnowledgeEntry[]>('/ai/knowledge')
      setEntries(data)
    } catch { /* ignore */ } finally { setKbLoading(false) }
  }, [])

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const data = await api.get<Stats>('/ai/stats')
      setStats(data)
    } catch { /* ignore */ } finally { setStatsLoading(false) }
  }, [])

  useEffect(() => { if (tab === 'feedback') loadFeedback() }, [tab, loadFeedback])
  useEffect(() => { if (tab === 'kb') loadKb() }, [tab, loadKb])
  useEffect(() => { if (tab === 'stats') loadStats() }, [tab, loadStats])

  async function addFeedbackToKb(fb: AiFeedback) {
    setAddingToKb(fb.id)
    try {
      await api.post(`/ai/feedback/${fb.id}/add-to-kb`, { category: 'FAQ' })
      setFeedbacks(prev => prev.map(f => f.id === fb.id ? { ...f, addedToKb: true } : f))
    } catch { alert('Thêm vào KB thất bại') } finally { setAddingToKb(null) }
  }

  async function saveKbEntry() {
    if (!kbForm.title.trim() || !kbForm.content.trim()) return
    setKbSaving(true)
    try {
      if (editEntry) {
        const updated = await api.patch<KnowledgeEntry>(`/ai/knowledge/${editEntry.id}`, kbForm)
        setEntries(prev => prev.map(e => e.id === editEntry.id ? updated : e))
      } else {
        const created = await api.post<KnowledgeEntry>('/ai/knowledge', kbForm)
        setEntries(prev => [created, ...prev])
      }
      setShowCreate(false)
      setEditEntry(null)
      setKbForm({ title: '', content: '', category: 'FAQ' })
    } catch { alert('Lưu thất bại') } finally { setKbSaving(false) }
  }

  async function toggleKbActive(entry: KnowledgeEntry) {
    try {
      const updated = await api.patch<KnowledgeEntry>(`/ai/knowledge/${entry.id}`, { isActive: !entry.isActive })
      setEntries(prev => prev.map(e => e.id === entry.id ? updated : e))
    } catch { alert('Cập nhật thất bại') }
  }

  async function deleteKbEntry(id: string) {
    if (!confirm('Xóa entry này?')) return
    try {
      await api.delete(`/ai/knowledge/${id}`)
      setEntries(prev => prev.filter(e => e.id !== id))
    } catch { alert('Xóa thất bại') }
  }

  function openEdit(entry: KnowledgeEntry) {
    setEditEntry(entry)
    setKbForm({ title: entry.title, content: entry.content, category: entry.category })
    setShowCreate(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Lora, serif' }}>
            AI Training
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">Cải thiện AI Concierge từ feedback khách</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1 w-fit">
        {[
          { key: 'feedback', label: '👍👎 Feedback' },
          { key: 'kb', label: '📚 Knowledge Base' },
          { key: 'stats', label: '📊 Thống kê' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              tab === t.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── FEEDBACK TAB ─────────────────────────────────────── */}
      {tab === 'feedback' && (
        <div>
          <div className="flex gap-2 mb-4">
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'good', label: '👍 Tốt' },
              { key: 'bad', label: '👎 Cần cải thiện' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFbFilter(f.key as typeof fbFilter)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  fbFilter === f.key
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {fbLoading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Đang tải...</div>
          ) : feedbacks.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Chưa có feedback nào. Khách sẽ thấy 👍/👎 dưới mỗi câu trả lời của AI Concierge.
            </div>
          ) : (
            <div className="space-y-3">
              {feedbacks.map(fb => (
                <div key={fb.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          fb.isGood ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {fb.isGood ? '👍 Tốt' : '👎 Cần cải thiện'}
                        </span>
                        {fb.addedToKb && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-semibold">✓ Đã vào KB</span>
                        )}
                        <span className="text-xs text-slate-400">{fmtDate(fb.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-1">Câu hỏi:</p>
                      <p className="text-sm font-medium text-slate-700 mb-2">{fb.question}</p>
                      <p className="text-xs text-slate-400 mb-1">Trả lời AI:</p>
                      <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-2 line-clamp-3">{fb.aiAnswer}</p>
                      {fb.correction && (
                        <>
                          <p className="text-xs text-amber-600 mt-2 mb-1 font-semibold">Khách đề xuất:</p>
                          <p className="text-sm text-amber-700 bg-amber-50 rounded-lg p-2">{fb.correction}</p>
                        </>
                      )}
                    </div>
                    {!fb.isGood && !fb.addedToKb && (
                      <button
                        disabled={addingToKb === fb.id}
                        onClick={() => addFeedbackToKb(fb)}
                        className="shrink-0 text-xs px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg border border-emerald-200 transition-colors disabled:opacity-50"
                      >
                        {addingToKb === fb.id ? '...' : '+ Thêm vào KB'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── KNOWLEDGE BASE TAB ───────────────────────────────── */}
      {tab === 'kb' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">{entries.length} entries · AI Concierge dùng để trả lời chính xác hơn</p>
            <button
              onClick={() => { setEditEntry(null); setKbForm({ title: '', content: '', category: 'FAQ' }); setShowCreate(true) }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              + Thêm entry
            </button>
          </div>

          {showCreate && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4">
                {editEntry ? 'Chỉnh sửa entry' : 'Thêm Knowledge Entry'}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Tiêu đề / Câu hỏi</label>
                  <input
                    value={kbForm.title}
                    onChange={e => setKbForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="VD: Giờ ăn sáng là mấy giờ?"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Nội dung / Câu trả lời đúng</label>
                  <textarea
                    value={kbForm.content}
                    onChange={e => setKbForm(f => ({ ...f, content: e.target.value }))}
                    placeholder="VD: Bữa sáng phục vụ từ 06:30–09:30 tại Nhà hàng Trầm, tầng 1..."
                    rows={4}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Danh mục</label>
                  <select
                    value={kbForm.category}
                    onChange={e => setKbForm(f => ({ ...f, category: e.target.value }))}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{CAT_LABEL[c]}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => { setShowCreate(false); setEditEntry(null) }}
                    className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                  <button
                    disabled={kbSaving || !kbForm.title.trim() || !kbForm.content.trim()}
                    onClick={saveKbEntry}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    {kbSaving ? 'Đang lưu...' : editEntry ? 'Lưu thay đổi' : 'Thêm vào KB'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {kbLoading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Đang tải...</div>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Knowledge Base trống. Thêm entries để AI Concierge trả lời chính xác hơn về resort.
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map(entry => (
                <div key={entry.id} className={`bg-white rounded-xl border p-4 shadow-sm transition-opacity ${!entry.isActive ? 'opacity-50' : ''}`}
                  style={{ borderColor: entry.isActive ? '#e2e8f0' : '#e2e8f0' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {CAT_LABEL[entry.category] ?? entry.category}
                        </span>
                        {!entry.isActive && (
                          <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Đã tắt</span>
                        )}
                        <span className="text-[11px] text-slate-400">{fmtDate(entry.updatedAt)}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 mb-1">{entry.title}</p>
                      <p className="text-sm text-slate-600 line-clamp-2">{entry.content}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleKbActive(entry)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-semibold border transition-colors ${
                          entry.isActive
                            ? 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {entry.isActive ? 'Tắt' : 'Bật'}
                      </button>
                      <button
                        onClick={() => openEdit(entry)}
                        className="text-xs px-2.5 py-1 rounded-lg font-semibold bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => deleteKbEntry(entry.id)}
                        className="text-xs px-2.5 py-1 rounded-lg font-semibold bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition-colors"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── STATS TAB ────────────────────────────────────────── */}
      {tab === 'stats' && (
        <div>
          {statsLoading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Đang tải...</div>
          ) : !stats ? (
            <div className="py-12 text-center text-slate-400 text-sm">Không có dữ liệu</div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                {[
                  { label: 'Tổng feedback', value: stats.total, color: 'text-slate-700' },
                  { label: 'Hài lòng', value: stats.good, color: 'text-emerald-600' },
                  { label: 'Cần cải thiện', value: stats.bad, color: 'text-red-500' },
                  { label: 'Satisfaction', value: `${stats.satisfactionRate}%`, color: stats.satisfactionRate >= 80 ? 'text-emerald-600' : 'text-amber-600' },
                  { label: 'Đã vào KB', value: stats.addedToKb, color: 'text-blue-600' },
                  { label: 'KB entries', value: stats.kbCount, color: 'text-purple-600' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4 text-center shadow-sm">
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Satisfaction bar */}
              <div className="bg-white rounded-xl border border-slate-100 p-5 mb-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-700 mb-3">Tỉ lệ hài lòng tổng thể</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${stats.satisfactionRate}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-emerald-600 w-12 text-right">{stats.satisfactionRate}%</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {stats.good} tốt / {stats.bad} cần cải thiện / {stats.total} tổng
                </p>
              </div>

              {/* Recent questions */}
              {stats.recentQuestions.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-700 mb-3">Câu hỏi gần nhất</p>
                  <div className="space-y-2">
                    {stats.recentQuestions.map((q, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-sm mt-0.5">{q.isGood ? '👍' : '👎'}</span>
                        <p className="text-sm text-slate-600 flex-1 line-clamp-1">{q.question}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
