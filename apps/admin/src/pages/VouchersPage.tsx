import { useEffect, useState } from 'react'
import { api, type GiftVoucher } from '../lib/api'

function formatPrice(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  USED: 'bg-slate-100 text-slate-500',
  EXPIRED: 'bg-red-100 text-red-500',
}

export function VouchersPage() {
  const [vouchers, setVouchers] = useState<GiftVoucher[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    value: '', fromName: '', fromEmail: '', toName: '', toEmail: '', message: '',
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    api.getVouchers().then(v => { setVouchers(v); setLoading(false) })
  }, [])

  const create = async () => {
    if (!form.value || !form.fromName || !form.toName) return
    setCreating(true)
    const v = await api.createVoucher({ ...form, value: Number(form.value) })
    setVouchers(prev => [v, ...prev])
    setShowCreate(false)
    setForm({ value: '', fromName: '', fromEmail: '', toName: '', toEmail: '', message: '' })
    setCreating(false)
  }

  const remove = async (id: string) => {
    if (!confirm('Xoá voucher này?')) return
    await api.deleteVoucher(id)
    setVouchers(prev => prev.filter(v => v.id !== id))
  }

  const active = vouchers.filter(v => v.status === 'ACTIVE').length
  const used = vouchers.filter(v => v.status === 'USED').length
  const totalValue = vouchers.filter(v => v.status === 'ACTIVE').reduce((s, v) => s + v.value, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Lora, serif' }}>Gift Voucher</h2>
        <button onClick={() => setShowCreate(true)}
          className="px-4 py-2 text-sm bg-[#1B4332] text-white rounded-lg hover:bg-[#2D6A4F]">
          + Tạo voucher
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Đang hoạt động', value: active, color: 'text-emerald-600' },
          { label: 'Đã sử dụng', value: used, color: 'text-slate-600' },
          { label: 'Tổng giá trị đang lưu hành', value: formatPrice(totalValue), color: 'text-amber-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <p className="text-xs text-slate-400 mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-16">Đang tải...</div>
      ) : vouchers.length === 0 ? (
        <div className="text-center text-slate-400 py-16"><div className="text-4xl mb-3">🎁</div>Chưa có voucher nào</div>
      ) : (
        <div className="space-y-3">
          {vouchers.map(v => (
            <div key={v.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
              <div className="text-3xl">🎁</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-emerald-700 text-sm">{v.code}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[v.status]}`}>{v.status}</span>
                  <span className="text-sm font-bold text-slate-800">{formatPrice(v.value)}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Từ: <strong>{v.fromName}</strong> → Đến: <strong>{v.toName}</strong>
                  {v.message && ` — "${v.message}"`}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  HSD: {new Date(v.expiresAt).toLocaleDateString('vi-VN')}
                  {v.usedAt && ` · Dùng: ${new Date(v.usedAt).toLocaleDateString('vi-VN')}`}
                </p>
              </div>
              <button onClick={() => remove(v.id)}
                className="text-xs text-red-400 hover:text-red-600 px-2 py-1">✕</button>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg mb-4">Tạo Gift Voucher</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Giá trị (VND) *</label>
                <input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                  placeholder="500000" className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Người tặng *</label>
                  <input value={form.fromName} onChange={e => setForm(f => ({ ...f, fromName: e.target.value }))}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Email người tặng</label>
                  <input type="email" value={form.fromEmail} onChange={e => setForm(f => ({ ...f, fromEmail: e.target.value }))}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Người nhận *</label>
                  <input value={form.toName} onChange={e => setForm(f => ({ ...f, toName: e.target.value }))}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Email người nhận</label>
                  <input type="email" value={form.toEmail} onChange={e => setForm(f => ({ ...f, toEmail: e.target.value }))}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Lời nhắn</label>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={2}
                  className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" placeholder="Lời chúc..." />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Huỷ</button>
              <button onClick={create} disabled={creating || !form.value || !form.fromName || !form.toName}
                className="flex-1 py-2 text-sm bg-[#1B4332] text-white rounded-lg hover:bg-[#2D6A4F] disabled:opacity-50">
                {creating ? 'Đang tạo...' : 'Tạo voucher'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
