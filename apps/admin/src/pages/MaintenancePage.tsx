import { useEffect, useState } from 'react'
import { api, type MaintenanceRequest } from '../lib/api'

const CAT_LABEL: Record<string, string> = {
  PLUMBING: 'Ống nước', ELECTRICAL: 'Điện', AC: 'Điều hoà',
  FURNITURE: 'Nội thất', CLEANING: 'Vệ sinh', OTHER: 'Khác',
}
const STATUS_META: Record<string, { label: string; color: string }> = {
  OPEN:        { label: 'Chờ xử lý',   color: 'bg-red-100 text-red-600' },
  IN_PROGRESS: { label: 'Đang xử lý',  color: 'bg-amber-100 text-amber-700' },
  RESOLVED:    { label: 'Đã xử lý',    color: 'bg-emerald-100 text-emerald-700' },
  CLOSED:      { label: 'Đã đóng',     color: 'bg-slate-100 text-slate-500' },
}
const PRIORITY_COLOR: Record<string, string> = {
  LOW: 'text-slate-400', NORMAL: 'text-blue-500', HIGH: 'text-orange-500', URGENT: 'text-red-600',
}
const PRIORITY_LABEL: Record<string, string> = {
  LOW: 'Thấp', NORMAL: 'Bình thường', HIGH: 'Cao', URGENT: 'Khẩn',
}
const NEXT_STATUS: Record<string, string> = {
  OPEN: 'IN_PROGRESS', IN_PROGRESS: 'RESOLVED', RESOLVED: 'CLOSED',
}
const NEXT_LABEL: Record<string, string> = {
  OPEN: 'Bắt đầu xử lý', IN_PROGRESS: 'Đánh dấu xong', RESOLVED: 'Đóng ticket',
}

function timeAgo(s: string) {
  const ms = Date.now() - new Date(s).getTime()
  const h = Math.floor(ms / 3_600_000)
  if (h < 1) return `${Math.floor(ms / 60_000)} phút trước`
  if (h < 24) return `${h} giờ trước`
  return `${Math.floor(h / 24)} ngày trước`
}

export function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [statusFilter, setStatusFilter] = useState('OPEN')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [detail, setDetail] = useState<MaintenanceRequest | null>(null)

  useEffect(() => {
    setLoading(true)
    api.getMaintenanceRequests(statusFilter || undefined)
      .then(setRequests)
      .finally(() => setLoading(false))
  }, [statusFilter])

  const advance = async (req: MaintenanceRequest) => {
    const next = NEXT_STATUS[req.status]
    if (!next) return
    setUpdating(req.id)
    const updated = await api.updateMaintenanceRequest(req.id, { status: next })
    setRequests(prev => prev.map(r => r.id === req.id ? updated : r))
    setUpdating(null)
    if (detail?.id === req.id) setDetail(updated)
  }

  const remove = async (id: string) => {
    if (!confirm('Xoá yêu cầu này?')) return
    await api.deleteMaintenanceRequest(id)
    setRequests(prev => prev.filter(r => r.id !== id))
    if (detail?.id === id) setDetail(null)
  }

  const counts = {
    OPEN: requests.filter(r => r.status === 'OPEN').length,
    IN_PROGRESS: requests.filter(r => r.status === 'IN_PROGRESS').length,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Lora, serif' }}>
            Sự cố & Bảo trì
          </h2>
          {(counts.OPEN + counts.IN_PROGRESS) > 0 && (
            <p className="text-sm text-red-500 mt-1 font-medium">
              ⚠ {counts.OPEN} chờ xử lý · {counts.IN_PROGRESS} đang xử lý
            </p>
          )}
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {[
            { v: 'OPEN', l: 'Chờ xử lý' },
            { v: 'IN_PROGRESS', l: 'Đang xử lý' },
            { v: 'RESOLVED', l: 'Đã xong' },
            { v: '', l: 'Tất cả' },
          ].map(({ v, l }) => (
            <button key={v} onClick={() => setStatusFilter(v)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>{l}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-16">Đang tải...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-3">🔧</div>
          <p className="text-slate-400">Không có sự cố nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req.id}
              className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-start gap-4 cursor-pointer hover:border-slate-200 transition-colors"
              onClick={() => setDetail(req)}>
              {/* Left: icon */}
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg shrink-0">
                {req.category === 'PLUMBING' ? '🚿' : req.category === 'ELECTRICAL' ? '⚡' : req.category === 'AC' ? '❄️' : req.category === 'FURNITURE' ? '🪑' : '🔧'}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-slate-800">{req.title}</span>
                  <span className={`text-xs font-bold ${PRIORITY_COLOR[req.priority]}`}>
                    ● {PRIORITY_LABEL[req.priority]}
                  </span>
                </div>
                <p className="text-sm text-slate-500 truncate">{req.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 flex-wrap">
                  <span>🛏 Phòng {req.room.number} · {req.room.roomType.name}</span>
                  <span>👤 {req.reporter.name}</span>
                  <span>{timeAgo(req.createdAt)}</span>
                  <span className="text-slate-300">·</span>
                  <span>{CAT_LABEL[req.category] ?? req.category}</span>
                </div>
              </div>

              {/* Right: status + action */}
              <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_META[req.status]?.color}`}>
                  {STATUS_META[req.status]?.label ?? req.status}
                </span>
                {NEXT_STATUS[req.status] && (
                  <button
                    disabled={updating === req.id}
                    onClick={() => advance(req)}
                    className="text-xs px-3 py-1.5 bg-[#1B4332] text-white rounded-lg hover:bg-[#2D6A4F] disabled:opacity-50 font-semibold">
                    {updating === req.id ? '...' : NEXT_LABEL[req.status]}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-slate-800 px-6 py-5 text-white flex items-start justify-between rounded-t-2xl sticky top-0">
              <div>
                <p className="text-slate-400 text-xs mb-0.5">
                  Phòng {detail.room.number} · {detail.room.roomType.name}
                </p>
                <p className="font-bold text-lg leading-tight">{detail.title}</p>
              </div>
              <button onClick={() => setDetail(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0 ml-4">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 text-sm">
              {/* Status + Priority */}
              <div className="flex gap-3 flex-wrap">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_META[detail.status]?.color}`}>
                  {STATUS_META[detail.status]?.label}
                </span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full bg-slate-100 ${PRIORITY_COLOR[detail.priority]}`}>
                  {PRIORITY_LABEL[detail.priority]}
                </span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                  {CAT_LABEL[detail.category]}
                </span>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Mô tả</p>
                <p className="text-slate-700 leading-relaxed">{detail.description}</p>
              </div>

              {/* Photo */}
              {detail.photoUrl && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Hình ảnh</p>
                  <img src={detail.photoUrl} alt="Hình sự cố"
                    className="w-full rounded-xl object-cover max-h-48" />
                </div>
              )}

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l: 'Báo cáo bởi', v: `${detail.reporter.name} (${detail.reporter.role})` },
                  { l: 'Thời gian', v: new Date(detail.createdAt).toLocaleString('vi-VN') },
                  ...(detail.resolvedAt ? [{ l: 'Giải quyết lúc', v: new Date(detail.resolvedAt).toLocaleString('vi-VN') }] : []),
                ].map(({ l, v }) => (
                  <div key={l} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-0.5">{l}</p>
                    <p className="font-medium text-slate-700 text-xs">{v}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                {NEXT_STATUS[detail.status] && (
                  <button
                    disabled={updating === detail.id}
                    onClick={() => advance(detail)}
                    className="flex-1 py-2.5 text-sm bg-[#1B4332] text-white rounded-xl font-semibold hover:bg-[#2D6A4F] disabled:opacity-50">
                    {updating === detail.id ? 'Đang cập nhật...' : NEXT_LABEL[detail.status]}
                  </button>
                )}
                <button onClick={() => remove(detail.id)}
                  className="px-4 py-2.5 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50">
                  Xoá
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
