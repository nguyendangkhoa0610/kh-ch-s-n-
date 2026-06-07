import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../lib/auth'

const BASE = import.meta.env.VITE_API_URL ?? '/api'

type Review = {
  id: string; name: string; location: string | null; room: string | null
  rating: number; text: string; approved: boolean; createdAt: string
}

function Stars({ n }: { n: number }) {
  return <span className="text-amber-400">{'★'.repeat(n)}<span className="text-slate-200">{'★'.repeat(5 - n)}</span></span>
}

export function ReviewsPage() {
  const { getHeaders } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending')
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch(`${BASE}/reviews/admin`, { headers: getHeaders() })
      .then(r => r.json())
      .then((j: { data: Review[] }) => setReviews(j.data ?? []))
      .catch(() => { /* silent */ })
      .finally(() => setLoading(false))
  }, [getHeaders])

  useEffect(() => { load() }, [load])

  async function setApproved(id: string, approved: boolean) {
    setBusy(id)
    try {
      await fetch(`${BASE}/reviews/${id}`, {
        method: 'PATCH', headers: getHeaders(),
        body: JSON.stringify({ approved }),
      })
      setReviews(prev => prev.map(r => r.id === id ? { ...r, approved } : r))
    } catch { alert('Lỗi cập nhật') } finally { setBusy(null) }
  }

  async function remove(id: string) {
    if (!confirm('Xóa đánh giá này?')) return
    setBusy(id)
    try {
      await fetch(`${BASE}/reviews/${id}`, { method: 'DELETE', headers: getHeaders() })
      setReviews(prev => prev.filter(r => r.id !== id))
    } catch { alert('Lỗi xóa') } finally { setBusy(null) }
  }

  const filtered = filter === 'all' ? reviews
    : filter === 'pending' ? reviews.filter(r => !r.approved)
    : reviews.filter(r => r.approved)

  const pendingCount = reviews.filter(r => !r.approved).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Lora, serif' }}>
          Đánh giá khách hàng
        </h2>
        {pendingCount > 0 && (
          <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full">
            {pendingCount} chờ duyệt
          </span>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5">
        {([['pending', 'Chờ duyệt'], ['approved', 'Đã duyệt'], ['all', 'Tất cả']] as const).map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
              filter === k ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">Không có đánh giá nào.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-slate-800">{r.name}</p>
                  <p className="text-xs text-slate-400">
                    {[r.location, r.room].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <Stars n={r.rating} />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">"{r.text}"</p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${r.approved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {r.approved ? '✓ Đã duyệt' : '⏳ Chờ duyệt'}
                </span>
                <div className="flex gap-2">
                  {!r.approved && (
                    <button onClick={() => setApproved(r.id, true)} disabled={busy === r.id}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 disabled:opacity-50">
                      Duyệt
                    </button>
                  )}
                  {r.approved && (
                    <button onClick={() => setApproved(r.id, false)} disabled={busy === r.id}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-50">
                      Ẩn
                    </button>
                  )}
                  <button onClick={() => remove(r.id)} disabled={busy === r.id}
                    className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50">
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
