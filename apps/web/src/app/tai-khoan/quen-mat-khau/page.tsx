"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError("Vui lòng nhập email"); return; }
    setLoading(true); setError("");
    try {
      await fetch(`${API}/auth/customer/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setSent(true); // Luôn hiện thành công để tránh email enumeration
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-slate-50 pt-[72px] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex w-14 h-14 bg-emerald-600 rounded-2xl items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h1 className="font-serif text-2xl text-slate-900 mb-1">Quên mật khẩu</h1>
            <p className="text-slate-500 text-sm">Nhập email để nhận link đặt lại mật khẩu</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            {sent ? (
              <div className="text-center py-4">
                <div className="text-5xl mb-4">📧</div>
                <h2 className="font-semibold text-slate-900 mb-2">Kiểm tra hộp thư</h2>
                <p className="text-slate-500 text-sm mb-6">
                  Nếu email <strong>{email}</strong> tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu trong vài phút.
                </p>
                <p className="text-xs text-slate-400 mb-4">Không thấy email? Kiểm tra thư mục Spam.</p>
                <Link href="/tai-khoan/dang-nhap"
                  className="text-emerald-600 font-semibold text-sm hover:underline">
                  ← Quay lại đăng nhập
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email tài khoản</label>
                  <input
                    type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
                    placeholder="ten@email.com" autoComplete="email"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                  {loading ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Đang gửi...</> : "Gửi link đặt lại"}
                </button>
                <div className="text-center pt-2">
                  <Link href="/tai-khoan/dang-nhap" className="text-sm text-slate-500 hover:text-emerald-600">
                    ← Quay lại đăng nhập
                  </Link>
                </div>
              </form>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mt-4 text-sm text-amber-700">
            <p className="font-semibold mb-1">Cần hỗ trợ ngay?</p>
            <p>Gọi lễ tân <a href="tel:0932183605" className="font-bold underline">0932 183 605</a> — chúng tôi sẽ hỗ trợ reset mật khẩu trực tiếp.</p>
          </div>
        </div>
      </main>
    </>
  );
}
