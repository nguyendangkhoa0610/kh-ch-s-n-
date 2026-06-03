"use client";

import { useState } from "react";

const ZALO = "0932183605";
const EMAIL = "hello@tramhuong-resort.vn";

const SUBJECTS = [
  "Hỏi về đặt phòng",
  "Tư vấn gói nghỉ dưỡng",
  "Hỏi về hoạt động / trải nghiệm",
  "Đặt dịch vụ thêm (spa, tour...)",
  "Phản hồi / góp ý",
  "Khác",
];

export function ContactForm() {
  const [form, setForm] = useState({ name: "", contact: "", subject: SUBJECTS[0], message: "" });
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  function setField(k: keyof typeof form, v: string) {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: undefined }));
  }

  function validate() {
    const e: Partial<typeof form> = {};
    if (!form.name.trim()) e.name = "Vui lòng nhập họ tên";
    if (!form.contact.trim()) e.contact = "Vui lòng nhập số điện thoại hoặc email";
    if (!form.message.trim()) e.message = "Vui lòng nhập nội dung";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleZalo() {
    if (!validate()) return;
    const msg = `[${form.subject}]\nHọ tên: ${form.name}\nLiên hệ: ${form.contact}\n\n${form.message}`;
    window.open(`https://zalo.me/${ZALO}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
    setSent(true);
  }

  function handleEmail() {
    if (!validate()) return;
    const body = `Họ tên: ${form.name}\nLiên hệ: ${form.contact}\n\n${form.message}`;
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  if (sent) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="font-serif text-xl text-slate-900 mb-2">Đã gửi!</h3>
        <p className="text-slate-500 text-sm mb-5">
          Chúng tôi sẽ phản hồi trong vòng 2–4 giờ qua Zalo hoặc email.
        </p>
        <button
          onClick={() => { setSent(false); setForm({ name: "", contact: "", subject: SUBJECTS[0], message: "" }); }}
          className="text-sm text-emerald-600 font-semibold hover:underline"
        >
          Gửi tin nhắn khác
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-7 space-y-4">
      <h2 className="font-serif text-xl text-slate-900">Gửi tin nhắn</h2>

      {/* Name */}
      <label className="block">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
          Họ tên <span className="text-rose-500">*</span>
        </span>
        <input
          type="text"
          value={form.name}
          onChange={e => setField("name", e.target.value)}
          placeholder="Nguyễn Văn A"
          className={`w-full border rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 ${errors.name ? "border-rose-400" : "border-slate-200"}`}
        />
        {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
      </label>

      {/* Contact */}
      <label className="block">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
          Số điện thoại hoặc email <span className="text-rose-500">*</span>
        </span>
        <input
          type="text"
          value={form.contact}
          onChange={e => setField("contact", e.target.value)}
          placeholder="0901 234 567 hoặc email@example.com"
          className={`w-full border rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 ${errors.contact ? "border-rose-400" : "border-slate-200"}`}
        />
        {errors.contact && <p className="text-xs text-rose-500 mt-1">{errors.contact}</p>}
      </label>

      {/* Subject */}
      <label className="block">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
          Chủ đề
        </span>
        <select
          value={form.subject}
          onChange={e => setField("subject", e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
        >
          {SUBJECTS.map(s => <option key={s}>{s}</option>)}
        </select>
      </label>

      {/* Message */}
      <label className="block">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
          Nội dung <span className="text-rose-500">*</span>
        </span>
        <textarea
          value={form.message}
          onChange={e => setField("message", e.target.value)}
          placeholder="Nhập câu hỏi hoặc yêu cầu của bạn..."
          rows={4}
          className={`w-full border rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 resize-none ${errors.message ? "border-rose-400" : "border-slate-200"}`}
        />
        {errors.message && <p className="text-xs text-rose-500 mt-1">{errors.message}</p>}
      </label>

      {/* Buttons */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={handleZalo}
          className="flex-1 py-3 bg-[#0068FF] hover:bg-[#0057CC] text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
        >
          <span className="font-bold">Za</span> Gửi qua Zalo
        </button>
        <button
          onClick={handleEmail}
          className="flex-1 py-3 border-2 border-slate-200 hover:border-emerald-400 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
        >
          ✉️ Gửi email
        </button>
      </div>

      <p className="text-center text-xs text-slate-400">Phản hồi trong 2–4 giờ · Zalo trả lời trong 5 phút</p>
    </div>
  );
}
