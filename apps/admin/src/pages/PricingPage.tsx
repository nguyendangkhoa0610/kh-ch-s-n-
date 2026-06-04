import { useEffect, useState } from 'react'
import { api, type SeasonalPrice, type RoomType } from '../lib/api'

function formatPrice(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('vi-VN')
}

export function PricingPage() {
  const [prices, setPrices] = useState<SeasonalPrice[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    roomTypeId: '', name: '', startDate: '', endDate: '',
    priceMultiplier: '1.0', fixedPrice: '',
  })

  useEffect(() => {
    Promise.all([api.getPricing(), api.getRoomTypes()])
      .then(([p, r]) => { setPrices(p); setRoomTypes(r) })
      .finally(() => setLoading(false))
  }, [])

  const create = async () => {
    if (!form.roomTypeId || !form.name || !form.startDate || !form.endDate) return
    const data = {
      roomTypeId: form.roomTypeId,
      name: form.name,
      startDate: form.startDate,
      endDate: form.endDate,
      priceMultiplier: Number(form.priceMultiplier),
      fixedPrice: form.fixedPrice ? Number(form.fixedPrice) : undefined,
    }
    const p = await api.createPricing(data)
    setPrices(prev => [...prev, p])
    setShowCreate(false)
    setForm({ roomTypeId: '', name: '', startDate: '', endDate: '', priceMultiplier: '1.0', fixedPrice: '' })
  }

  const toggleActive = async (p: SeasonalPrice) => {
    await api.updatePricing(p.id, { isActive: !p.isActive } as any)
    setPrices(prev => prev.map(i => i.id === p.id ? { ...i, isActive: !i.isActive } : i))
  }

  const remove = async (id: string) => {
    if (!confirm('Xoá giá này?')) return
    await api.deletePricing(id)
    setPrices(prev => prev.filter(p => p.id !== id))
  }

  const activePrices = prices.filter(p => {
    const now = new Date()
    return p.isActive && new Date(p.startDate) <= now && new Date(p.endDate) >= now
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Lora, serif' }}>Dynamic Pricing</h2>
          <p className="text-sm text-slate-500 mt-1">{activePrices.length} mức giá đang áp dụng</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="px-4 py-2 text-sm bg-[#1B4332] text-white rounded-lg hover:bg-[#2D6A4F]">
          + Thêm giá mùa vụ
        </button>
      </div>

      {loading ? <div className="text-center text-slate-400 py-16">Đang tải...</div> : prices.length === 0 ? (
        <div className="text-center text-slate-400 py-16">
          <div className="text-4xl mb-3">💰</div>
          <p>Chưa có mức giá mùa vụ nào</p>
          <p className="text-xs mt-1">Thêm giá Tết, Hè, cuối tuần để tự động điều chỉnh</p>
        </div>
      ) : (
        <div className="space-y-3">
          {prices.map(p => {
            const now = new Date()
            const isActive = p.isActive && new Date(p.startDate) <= now && new Date(p.endDate) >= now
            const isUpcoming = p.isActive && new Date(p.startDate) > now
            const effectivePrice = p.fixedPrice ?? Math.round(p.roomType.basePrice * p.priceMultiplier)
            return (
              <div key={p.id} className={`bg-white rounded-xl border p-4 shadow-sm flex items-center gap-4 ${isActive ? 'border-emerald-200' : 'border-slate-100'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800">{p.name}</span>
                    {isActive && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">● Đang áp dụng</span>}
                    {isUpcoming && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Sắp tới</span>}
                    {!p.isActive && <span className="text-xs bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">Tắt</span>}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{p.roomType.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatDate(p.startDate)} → {formatDate(p.endDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">
                    {p.fixedPrice ? 'Giá cố định' : `×${p.priceMultiplier}`}
                  </p>
                  <p className="font-bold text-emerald-600">{formatPrice(effectivePrice)}</p>
                  <p className="text-xs text-slate-400 line-through">{formatPrice(p.roomType.basePrice)}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => toggleActive(p)}
                    className={`text-xs px-3 py-1.5 rounded-lg ${p.isActive ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                    {p.isActive ? 'Tắt' : 'Bật'}
                  </button>
                  <button onClick={() => remove(p.id)} className="text-xs text-red-400 hover:text-red-600 px-2">✕</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg mb-4">Thêm giá mùa vụ</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Tên (vd: Tết 2026, Hè) *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Loại phòng *</label>
                <select value={form.roomTypeId} onChange={e => setForm(f => ({ ...f, roomTypeId: e.target.value }))}
                  className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm">
                  <option value="">Chọn loại phòng</option>
                  {roomTypes.map(r => <option key={r.id} value={r.id}>{r.name} ({(r.basePrice / 1000).toFixed(0)}K)</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Từ ngày *</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Đến ngày *</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Hệ số giá (vd: 1.5 = +50%)</label>
                  <input type="number" step="0.1" min="0.5" max="5" value={form.priceMultiplier}
                    onChange={e => setForm(f => ({ ...f, priceMultiplier: e.target.value }))}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Giá cố định (VND, tuỳ chọn)</label>
                  <input type="number" value={form.fixedPrice} onChange={e => setForm(f => ({ ...f, fixedPrice: e.target.value }))}
                    placeholder="Bỏ trống = dùng hệ số"
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              {form.roomTypeId && form.priceMultiplier && (
                <div className="bg-slate-50 rounded-lg p-3 text-sm">
                  <span className="text-slate-500">Giá áp dụng: </span>
                  <span className="font-bold text-emerald-600">
                    {formatPrice(
                      form.fixedPrice
                        ? Number(form.fixedPrice)
                        : Math.round((roomTypes.find(r => r.id === form.roomTypeId)?.basePrice ?? 0) * Number(form.priceMultiplier))
                    )}
                  </span>
                  <span className="text-slate-400 text-xs ml-1">/đêm</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Huỷ</button>
              <button onClick={create} disabled={!form.roomTypeId || !form.name || !form.startDate || !form.endDate}
                className="flex-1 py-2 text-sm bg-[#1B4332] text-white rounded-lg hover:bg-[#2D6A4F] disabled:opacity-50">
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
