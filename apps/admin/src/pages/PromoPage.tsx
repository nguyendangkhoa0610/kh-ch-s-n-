import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../lib/auth'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

type Promo = {
  id: string; code: string; discountPercent: number
  maxUses: number; usedCount: number; expiresAt: string | null
  active: boolean; description: string | null; createdAt: string
}

export function PromoPage() {
  const { getHeaders } = useAuth()
  const [promos, setPromos] = useState<Promo[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ code: '', discountPercent: '10', maxUses: '100', expiresAt: '', description: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    fetch(`${BASE}/promo`, { headers: getHeaders() })
      .then(r => r.json())
      .then((j: { data: Promo[] }) => setPromos(j.data ?? []))
      .catch(() => { /* silent */ })
      .finally(() => setLoading(false))
  }, [getHeaders])

  useEffect(() => { load() }, [load])

  async function create() {
    if (!form.code.trim()) { alert('Nhập mã'); return }
    setSaving(true)
    try {
      const res = await fetch(`${BASE}/promo`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({
          code: form.code.trim(),
          discountPercent: Number(form.discountPercent),
          maxUses: Number(form.maxUses),
          expiresAt: form.expiresAt || undefined,
          description: form.description.trim() || undefined,
        }),
      })
      const json = await res.json() as { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Lỗi')
      setForm({ code: '', discountPercent: '10', maxUses: '100', expiresAt: '', description: '' })
      setShowForm(false)
      load()
    } catch (e) { alert(e instanceof Error ? e.message : 'Lỗi tạo mã') } finally { setSaving(false) }
  }

  async function toggle(id: string, active: boolean) {
    await fetch(`${BASE}/promo/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ active }) })
    setPromos(prev => prev.map(p => p.id === id ? { ...p, active } : p))
  }

  async function remove(id: string) {
    if (!confirm('Xóa mã giảm giá này?')) return
    await fetch(`${BASE}/promo/${id}`, { method: 'DELETE', headers: getHeaders() })
    setPromos(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Lora, serif' }}>
          Mã giảm giá
        </h2>
        <button onClick={() => setShowForm(s => !s)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors">
          {showForm ? 'Đóng' : '+ Tạo mã mới'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-semibold text-slate-500 uppercase block mb-1.5">Mã (VD: SUMMER2026)</span>
              <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-500 uppercase block mb-1.5">Giảm (%)</span>
              <input type="number" min="1" max="100" value={form.discountPercent}
                onChange={e => setForm(f => ({ ...f, discountPercent: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-500 uppercase block mb-1.5">Số lượt tối đa</span>
              <input type="number" min="1" value={form.maxUses}
                onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-500 uppercase block mb-1.5">Hết hạn (tùy chọn)</span>
              <input type="date" value={form.expiresAt}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-slate-500 uppercase block mb-1.5">Mô tả (tùy chọn)</span>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="VD: Khuyến mãi hè 2026"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </label>
          </div>
          <button onClick={create} disabled={saving}
            className="mt-4 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl">
            {saving ? 'Đang tạo...' : 'Tạo mã'}
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">Đang tải...</div>
      ) : promos.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">Chưa có mã giảm giá nào.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Mã', 'Giảm', 'Đã dùng', 'Hết hạn', 'Trạng thái', ''].map(c => (
                  <th key={c} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {promos.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-emerald-700">{p.code}</span>
                    {p.description && <p className="text-xs text-slate-400">{p.description}</p>}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{p.discountPercent}%</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{p.usedCount}/{p.maxUses}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString('vi-VN') : '∞'}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(p.id, !p.active)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {p.active ? 'Đang bật' : 'Đã tắt'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove(p.id)} className="text-xs font-semibold text-red-500 hover:text-red-700">Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
