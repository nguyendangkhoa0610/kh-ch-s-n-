"use client";

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const PRESET_VALUES = [500_000, 1_000_000, 2_000_000];

function formatPrice(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

export function VoucherPurchaseForm() {
  const [value, setValue] = useState(1_000_000);
  const [customValue, setCustomValue] = useState("");
  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [toName, setToName] = useState("");
  const [toEmail, setToEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ code: string; value: number } | null>(null);
  const [error, setError] = useState("");

  const finalValue = customValue ? Number(customValue) : value;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromName || !toName) { setError("Vui lòng nhập tên người tặng và người nhận"); return; }
    if (finalValue < 200_000) { setError("Giá trị tối thiểu 200,000đ"); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API}/vouchers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: finalValue, fromName, fromEmail, toName, toEmail, message }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Có lỗi xảy ra"); return; }
      setResult({ code: json.data.code, value: json.data.value });
    } catch { setError("Không kết nối được server"); } finally { setSubmitting(false); }
  };

  if (result) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center shadow-2xl">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="font-serif text-2xl text-slate-800 mb-2">Voucher đã tạo thành công!</h2>
        <p className="text-slate-500 mb-6">Lưu mã này để dùng khi đặt phòng</p>
        <div className="bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-2xl p-6 mb-6">
          <p className="text-xs text-emerald-600 font-semibold mb-2">MÃ VOUCHER</p>
          <p className="font-mono text-3xl font-bold text-emerald-700 tracking-widest">{result.code}</p>
          <p className="text-emerald-600 font-semibold mt-2">{formatPrice(result.value)}</p>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          Tặng mã này cho <strong>{toName}</strong>.<br />
          Áp dụng khi đặt phòng tại <strong>/dat-phong</strong>
        </p>
        <button
          onClick={() => { setResult(null); setFromName(""); setToName(""); setFromEmail(""); setToEmail(""); setMessage(""); }}
          className="px-6 py-3 bg-[#1B4332] text-white rounded-xl font-semibold hover:bg-[#2D6A4F] transition-colors"
        >
          Tạo voucher mới
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-3xl p-8 shadow-2xl space-y-5">
      {/* Value picker */}
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-3">
          Giá trị voucher
        </label>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {PRESET_VALUES.map((v) => (
            <button key={v} type="button"
              onClick={() => { setValue(v); setCustomValue(""); }}
              className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-colors ${
                value === v && !customValue
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 text-slate-600 hover:border-emerald-300"
              }`}
            >
              {formatPrice(v)}
            </button>
          ))}
        </div>
        <input
          type="number"
          placeholder="Hoặc nhập giá trị khác (tối thiểu 200,000đ)"
          value={customValue}
          onChange={e => { setCustomValue(e.target.value); }}
          min={200000}
          step={50000}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      <div className="border-t border-slate-100 pt-5 space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Người tặng</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Họ tên *</label>
            <input value={fromName} onChange={e => setFromName(e.target.value)} required
              placeholder="Nguyễn Văn A"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Email</label>
            <input type="email" value={fromEmail} onChange={e => setFromEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-5 space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Người nhận</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Họ tên *</label>
            <input value={toName} onChange={e => setToName(e.target.value)} required
              placeholder="Trần Thị B"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Email</label>
            <input type="email" value={toEmail} onChange={e => setToEmail(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Lời nhắn</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
            placeholder="Chúc mừng sinh nhật! Tặng bạn kỳ nghỉ thật đặc biệt..."
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}

      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="text-xs text-slate-400">Tổng giá trị</p>
          <p className="text-2xl font-bold text-emerald-700">{formatPrice(finalValue || value)}</p>
        </div>
        <button type="submit" disabled={submitting}
          className="px-8 py-3.5 bg-[#1B4332] text-white rounded-2xl font-semibold hover:bg-[#2D6A4F] transition-colors disabled:opacity-50">
          {submitting ? "Đang tạo..." : "Tạo Voucher 🎁"}
        </button>
      </div>
    </form>
  );
}
