"use client";

import { useState } from "react";

const ZALO = "0932183605";

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="text-2xl transition-transform hover:scale-110"
        >
          <span className={(hovered || value) >= n ? "text-amber-400" : "text-slate-200"}>★</span>
        </button>
      ))}
    </div>
  );
}

export function ReviewForm() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", room: "", rating: 5, text: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ROOM_OPTIONS = [
    "Bungalow View Biển", "Nhà Sàn Rừng", "Villa Gia Đình",
    "Eco Pod", "Lều Đồng Cỏ", "Suite Trầm Hương",
  ];

  async function handleSubmit() {
    if (!form.name.trim() || !form.text.trim()) return;
    if (form.text.trim().length < 20) { setError("Đánh giá tối thiểu 20 ký tự"); return; }
    setLoading(true); setError("");
    try {
      const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
      const res = await fetch(`${API}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          location: form.location.trim() || undefined,
          room: form.room || undefined,
          rating: form.rating,
          text: form.text.trim(),
        }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Gửi đánh giá thất bại");
      setSent(true);
    } catch (err) {
      // Fallback: gửi qua Zalo nếu API lỗi
      const msg = `⭐ Đánh giá mới\n👤 ${form.name}${form.location ? ` — ${form.location}` : ""}\n🏡 ${form.room || "Chưa chọn"}\n${"★".repeat(form.rating)} (${form.rating}/5)\n\n"${form.text}"`;
      window.open(`https://zalo.me/${ZALO}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
      setSent(true);
      void err;
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-6 py-3 border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white font-semibold rounded-full text-sm transition-colors"
      >
        ✍️ Viết đánh giá
      </button>
    );
  }

  if (sent) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg mx-auto text-center">
        <div className="text-4xl mb-3">🙏</div>
        <p className="font-semibold text-slate-900 mb-1">Cảm ơn bạn đã chia sẻ!</p>
        <p className="text-sm text-slate-500 mb-4">Đội ngũ chúng tôi sẽ xem xét và đăng đánh giá của bạn.</p>
        <button onClick={() => { setSent(false); setOpen(false); setForm({ name: "", location: "", room: "", rating: 5, text: "" }); }}
          className="text-sm text-emerald-600 hover:underline font-semibold">
          Đóng
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-lg mx-auto text-left">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-serif text-lg text-slate-900">Chia sẻ trải nghiệm của bạn</h3>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
      </div>

      <div className="space-y-4">
        {/* Rating */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Đánh giá</p>
          <StarPicker value={form.rating} onChange={(n) => setForm(f => ({ ...f, rating: n }))} />
        </div>

        {/* Name + location */}
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Họ tên *</span>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nguyễn Văn A"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Địa điểm</span>
            <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="Hà Nội"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
          </label>
        </div>

        {/* Room */}
        <label className="block">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Loại phòng đã ở</span>
          <select value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50">
            <option value="">Chọn loại phòng...</option>
            {ROOM_OPTIONS.map(r => <option key={r}>{r}</option>)}
          </select>
        </label>

        {/* Review text */}
        <label className="block">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Đánh giá của bạn *</span>
          <textarea value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
            placeholder="Chia sẻ trải nghiệm của bạn tại Trầm Hương..."
            rows={4}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 resize-none" />
        </label>

        {error && <p className="text-xs text-rose-500 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading || !form.name.trim() || !form.text.trim()}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading ? "Đang gửi..." : <><span>✍️</span> Gửi đánh giá</>}
        </button>
        <p className="text-center text-xs text-slate-400">Đánh giá sẽ được kiểm duyệt trước khi đăng</p>
      </div>
    </div>
  );
}
