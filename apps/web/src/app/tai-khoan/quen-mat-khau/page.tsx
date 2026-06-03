"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteNav } from "@/components/site-nav";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

// ─── Form quên mật khẩu (gửi email) ────────────────────────────────

function ForgotForm() {
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
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center py-4">
        <div className="text-5xl mb-4">📧</div>
        <h2 className="font-semibold text-slate-900 mb-2">Kiểm tra hộp thư</h2>
        <p className="text-slate-500 text-sm mb-6">
          Nếu email <strong>{email}</strong> tồn tại trong hệ thống, bạn sẽ nhận link đặt lại mật khẩu trong vài phút.
        </p>
        <p className="text-xs text-slate-400 mb-4">Không thấy email? Kiểm tra thư mục Spam.</p>
        <Link href="/tai-khoan/dang-nhap" className="text-emerald-600 font-semibold text-sm hover:underline">
          ← Quay lại đăng nhập
        </Link>
      </div>
    );
  }

  return (
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
        {loading
          ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Đang gửi...</>
          : "Gửi link đặt lại"}
      </button>
      <div className="text-center pt-2">
        <Link href="/tai-khoan/dang-nhap" className="text-sm text-slate-500 hover:text-emerald-600">
          ← Quay lại đăng nhập
        </Link>
      </div>
    </form>
  );
}

// ─── Form đặt lại mật khẩu (sau khi click link email) ──────────────

function ResetForm({ token }: { token: string }) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) { setError("Mật khẩu tối thiểu 6 ký tự"); return; }
    if (pw !== confirm) { setError("Mật khẩu xác nhận không khớp"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/auth/customer/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: pw }),
      });
      const json = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Đặt lại mật khẩu thất bại");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="font-semibold text-slate-900 mb-2">Mật khẩu đã được đặt lại!</h2>
        <p className="text-slate-500 text-sm mb-6">Bạn có thể đăng nhập bằng mật khẩu mới.</p>
        <Link href="/tai-khoan/dang-nhap"
          className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors">
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleReset} className="space-y-5">
      <div>
        <h2 className="font-semibold text-slate-900 mb-1">Mật khẩu mới</h2>
        <p className="text-slate-500 text-sm mb-5">Nhập mật khẩu mới cho tài khoản của bạn.</p>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mật khẩu mới</label>
        <input
          type="password" value={pw} onChange={e => { setPw(e.target.value); setError(""); }}
          placeholder="Tối thiểu 6 ký tự" autoComplete="new-password"
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Xác nhận mật khẩu</label>
        <input
          type="password" value={confirm} onChange={e => { setConfirm(e.target.value); setError(""); }}
          placeholder="Nhập lại mật khẩu" autoComplete="new-password"
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
        {loading
          ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Đang xử lý...</>
          : "Đặt lại mật khẩu"}
      </button>
    </form>
  );
}

// ─── Main page ───────────────────────────────────────────────────────

function ForgotPasswordContent() {
  const params = useSearchParams();
  const token = params.get("token");

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
            <h1 className="font-serif text-2xl text-slate-900 mb-1">
              {token ? "Đặt lại mật khẩu" : "Quên mật khẩu"}
            </h1>
            {!token && <p className="text-slate-500 text-sm">Nhập email để nhận link đặt lại mật khẩu</p>}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            {token ? <ResetForm token={token} /> : <ForgotForm />}
          </div>

          {!token && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mt-4 text-sm text-amber-700">
              <p className="font-semibold mb-1">Cần hỗ trợ ngay?</p>
              <p>Gọi lễ tân <a href="tel:0932183605" className="font-bold underline">0932 183 605</a> — chúng tôi sẽ hỗ trợ reset mật khẩu trực tiếp.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 pt-[72px] flex items-center justify-center"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
