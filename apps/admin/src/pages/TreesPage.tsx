import { useEffect, useState } from 'react'

const BASE = import.meta.env.VITE_API_URL ?? '/api'

type Tree = {
  id: string; qrCode: string; name: string; scientificName: string | null
  age: number | null; height: number | null; description: string
  ecoValue: string; story: string | null; imageUrl: string | null
  location: string | null; isActive: boolean; createdAt: string
}

const EMPTY_FORM = {
  qrCode: '', name: '', scientificName: '', age: '', height: '',
  description: '', ecoValue: '', story: '', imageUrl: '', location: '',
}

export function TreesPage() {
  const [trees, setTrees] = useState<Tree[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTree, setEditTree] = useState<Tree | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`${BASE}/trees`).then(r => r.json())
      .then(j => { setTrees(j.data ?? []); setLoading(false) })
  }, [])

  const openCreate = () => {
    setEditTree(null); setForm(EMPTY_FORM); setShowForm(true)
  }
  const openEdit = (t: Tree) => {
    setEditTree(t)
    setForm({
      qrCode: t.qrCode, name: t.name, scientificName: t.scientificName ?? '',
      age: t.age ? String(t.age) : '', height: t.height ? String(t.height) : '',
      description: t.description, ecoValue: t.ecoValue,
      story: t.story ?? '', imageUrl: t.imageUrl ?? '', location: t.location ?? '',
    })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.qrCode || !form.name || !form.description) return
    setSaving(true)
    const data = {
      ...form,
      age: form.age ? Number(form.age) : null,
      height: form.height ? Number(form.height) : null,
      scientificName: form.scientificName || null,
      story: form.story || null,
      imageUrl: form.imageUrl || null,
      location: form.location || null,
    }
    if (editTree) {
      const r = await fetch(`${BASE}/trees/${editTree.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      })
      const j = await r.json()
      setTrees(prev => prev.map(t => t.id === editTree.id ? j.data : t))
    } else {
      const r = await fetch(`${BASE}/trees`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      })
      const j = await r.json()
      setTrees(prev => [j.data, ...prev])
    }
    setSaving(false); setShowForm(false)
  }

  const deactivate = async (id: string) => {
    if (!confirm('Ẩn cây này?')) return
    await fetch(`${BASE}/trees/${id}`, { method: 'DELETE' })
    setTrees(prev => prev.map(t => t.id === id ? { ...t, isActive: false } : t))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Lora, serif' }}>AR Discovery — Cây xanh</h2>
          <p className="text-sm text-slate-500 mt-1">{trees.filter(t => t.isActive).length} cây đang hoạt động</p>
        </div>
        <button onClick={openCreate}
          className="px-4 py-2 text-sm bg-[#1B4332] text-white rounded-lg hover:bg-[#2D6A4F]">
          + Thêm cây
        </button>
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-16">Đang tải...</div>
      ) : trees.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-3">🌳</div>
          <p className="text-slate-400">Chưa có cây nào. Thêm cây và in QR code để đặt trên biển.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trees.map(tree => (
            <div key={tree.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${!tree.isActive ? 'opacity-50' : 'border-slate-100'}`}>
              {tree.imageUrl && (
                <img src={tree.imageUrl} alt={tree.name} className="w-full h-36 object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-800">{tree.name}</h3>
                    {tree.scientificName && <p className="text-xs text-slate-400 italic">{tree.scientificName}</p>}
                  </div>
                  <span className="font-mono text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                    {tree.qrCode}
                  </span>
                </div>
                <div className="flex gap-3 mt-2 text-xs text-slate-500 flex-wrap">
                  {tree.age && <span>🕐 {tree.age} tuổi</span>}
                  {tree.height && <span>📏 {tree.height}m</span>}
                  {tree.location && <span>📍 {tree.location}</span>}
                </div>
                <p className="text-sm text-slate-600 mt-2 line-clamp-2">{tree.description}</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEdit(tree)}
                    className="flex-1 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50">Sửa</button>
                  {tree.isActive && (
                    <button onClick={() => deactivate(tree.id)}
                      className="py-1.5 px-3 text-xs text-red-400 border border-red-200 rounded-lg hover:bg-red-50">Ẩn</button>
                  )}
                  <button
                    onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(tree.qrCode)}`, '_blank')}
                    className="py-1.5 px-3 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100">
                    QR
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">{editTree ? 'Sửa cây' : 'Thêm cây mới'}</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Mã QR (unique) *</label>
                  <input value={form.qrCode} onChange={e => setForm(f => ({ ...f, qrCode: e.target.value }))}
                    placeholder="vd: TREE-001" disabled={!!editTree}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Tên cây *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Cây Trầm Hương"
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Tên khoa học</label>
                  <input value={form.scientificName} onChange={e => setForm(f => ({ ...f, scientificName: e.target.value }))}
                    placeholder="Aquilaria crassna" className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Tuổi (năm)</label>
                  <input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Chiều cao (m)</label>
                  <input type="number" step="0.1" value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Vị trí trong resort</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="vd: Khu A, gần hồ bơi"
                  className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Mô tả *</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                  className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Giá trị sinh thái *</label>
                <textarea value={form.ecoValue} onChange={e => setForm(f => ({ ...f, ecoValue: e.target.value }))} rows={2}
                  placeholder="Hấp thụ CO2, cung cấp O2, là nơi trú ngụ của..." className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Câu chuyện</label>
                <textarea value={form.story} onChange={e => setForm(f => ({ ...f, story: e.target.value }))} rows={2}
                  className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">URL ảnh</label>
                <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Huỷ</button>
              <button onClick={save} disabled={saving || !form.qrCode || !form.name || !form.description}
                className="flex-1 py-2 text-sm bg-[#1B4332] text-white rounded-lg hover:bg-[#2D6A4F] disabled:opacity-50">
                {saving ? 'Đang lưu...' : editTree ? 'Lưu' : 'Thêm cây'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
