import { useEffect, useState } from 'react'
import { api, type MenuItem, type FoodOrder } from '../lib/api'

const CATEGORIES = ['BREAKFAST', 'LUNCH', 'DINNER', 'DRINKS', 'SNACKS']
const CAT_LABEL: Record<string, string> = {
  BREAKFAST: 'Bữa sáng', LUNCH: 'Bữa trưa', DINNER: 'Bữa tối', DRINKS: 'Đồ uống', SNACKS: 'Ăn vặt',
}
const ORDER_STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PREPARING: 'bg-violet-100 text-violet-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-500',
}
const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ', CONFIRMED: 'Xác nhận', PREPARING: 'Đang làm', DELIVERED: 'Đã giao', CANCELLED: 'Huỷ',
}
const NEXT_ORDER_STATUS: Record<string, string> = {
  PENDING: 'CONFIRMED', CONFIRMED: 'PREPARING', PREPARING: 'DELIVERED',
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

export function MenuPage() {
  const [tab, setTab] = useState<'menu' | 'orders'>('orders')
  const [items, setItems] = useState<MenuItem[]>([])
  const [orders, setOrders] = useState<FoodOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  const [form, setForm] = useState({ name: '', nameEn: '', description: '', category: 'LUNCH', price: '', image: '', isVeg: false })

  useEffect(() => {
    setLoading(true)
    Promise.all([api.getAllMenuItems(), api.getFoodOrders()])
      .then(([m, o]) => { setItems(m); setOrders(o) })
      .finally(() => setLoading(false))
  }, [])

  const openCreate = () => {
    setEditItem(null)
    setForm({ name: '', nameEn: '', description: '', category: 'LUNCH', price: '', image: '', isVeg: false })
    setShowCreate(true)
  }

  const openEdit = (item: MenuItem) => {
    setEditItem(item)
    setForm({ name: item.name, nameEn: item.nameEn ?? '', description: item.description ?? '', category: item.category, price: String(item.price), image: item.image ?? '', isVeg: item.isVeg })
    setShowCreate(true)
  }

  const save = async () => {
    const data = { ...form, price: Number(form.price) }
    if (editItem) {
      const updated = await api.updateMenuItem(editItem.id, data)
      setItems(prev => prev.map(i => i.id === editItem.id ? updated : i))
    } else {
      const created = await api.createMenuItem(data)
      setItems(prev => [created, ...prev])
    }
    setShowCreate(false)
  }

  const toggle = async (item: MenuItem) => {
    await api.updateMenuItem(item.id, { isActive: !item.isActive })
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, isActive: !i.isActive } : i))
  }

  const updateOrderStatus = async (id: string, status: string) => {
    await api.updateFoodOrderStatus(id, status)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  const pendingCount = orders.filter(o => o.status === 'PENDING' || o.status === 'PREPARING').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Lora, serif' }}>Nhà hàng & Menu</h2>
        <button onClick={openCreate}
          className="px-4 py-2 text-sm bg-[#1B4332] text-white rounded-lg hover:bg-[#2D6A4F]">
          + Thêm món
        </button>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
        {([['orders', `Đơn đặt${pendingCount ? ` (${pendingCount})` : ''}`], ['menu', 'Quản lý menu']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${tab === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center text-slate-400 py-16">Đang tải...</div> : tab === 'menu' ? (
        <div className="space-y-6">
          {CATEGORIES.map(cat => {
            const catItems = items.filter(i => i.category === cat)
            if (!catItems.length) return null
            return (
              <div key={cat}>
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">{CAT_LABEL[cat]}</h3>
                <div className="space-y-2">
                  {catItems.map(item => (
                    <div key={item.id} className={`flex items-center gap-4 bg-white rounded-xl border p-4 ${!item.isActive ? 'opacity-50' : 'border-slate-100'}`}>
                      {item.image && <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover" />}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{item.name}</span>
                          {item.isVeg && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">🌿 Chay</span>}
                        </div>
                        {item.description && <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>}
                        <p className="text-sm font-bold text-emerald-600 mt-1">{formatPrice(item.price)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(item)} className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50">Sửa</button>
                        <button onClick={() => toggle(item)} className={`text-xs px-3 py-1.5 rounded-lg ${item.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                          {item.isActive ? 'Ẩn' : 'Hiện'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="text-center text-slate-400 py-16"><div className="text-4xl mb-3">🍽️</div>Chưa có đơn đặt món</div>
          ) : orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-mono text-sm font-bold text-emerald-700">#{order.booking?.code}</span>
                  <span className="text-sm text-slate-500 ml-2">Phòng {order.booking?.room?.number ?? '—'}</span>
                  <span className="text-xs text-slate-400 ml-2">· {order.user?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ORDER_STATUS_COLOR[order.status]}`}>
                    {ORDER_STATUS_LABEL[order.status]}
                  </span>
                  {NEXT_ORDER_STATUS[order.status] && (
                    <button onClick={() => updateOrderStatus(order.id, NEXT_ORDER_STATUS[order.status])}
                      className="text-xs px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 font-semibold">
                      → {ORDER_STATUS_LABEL[NEXT_ORDER_STATUS[order.status]]}
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500">×{item.quantity}</span>
                    <span className="text-slate-700">{item.menuItem.name}</span>
                    <span className="text-slate-400 text-xs ml-auto">{formatPrice(item.unitPrice * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                <span className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleString('vi-VN')}</span>
                <span className="font-bold text-sm text-slate-800">{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg mb-4">{editItem ? 'Sửa món' : 'Thêm món mới'}</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Tên món *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Tên tiếng Anh</label>
                  <input value={form.nameEn} onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Danh mục</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm">
                    {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Giá (VND) *</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Mô tả</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">URL hình ảnh</label>
                <input value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                  className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isVeg} onChange={e => setForm(f => ({ ...f, isVeg: e.target.checked }))} />
                <span className="text-sm text-slate-700">Món chay 🌿</span>
              </label>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Huỷ</button>
              <button onClick={save} disabled={!form.name || !form.price}
                className="flex-1 py-2 text-sm bg-[#1B4332] text-white rounded-lg hover:bg-[#2D6A4F] disabled:opacity-50">
                {editItem ? 'Lưu' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
