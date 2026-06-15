"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { useCustomerAuth, useHasHydrated } from "@/lib/customer-auth";

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    password.length >= 6,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const levels = ["", "Yếu", "Trung bình", "Mạnh", "Rất mạnh"];
  const colors = ["", "bg-red-400", "bg-amber-400", "bg-emerald-400", "bg-emerald-600"];
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? colors[score] : "bg-slate-200"}`} />
        ))}
      </div>
      <p className="text-xs text-slate-400">{levels[score]}</p>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/tai-khoan";
  const prefillEmail = searchParams.get("email") ?? "";
  const { register, user } = useCustomerAuth();
  const _hasHydrated = useHasHydrated();
  const [form, setForm] = useState({ name: "", email: prefillEmail, phone: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form & { general: string }>>({});

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (_hasHydrated && user) router.replace(redirect); }, [user, _hasHydrated, redirect]);

  function setField(k: keyof typeof form, v: string) {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: undefined, general: undefined }));
  }

  function validate() {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Vui lòng nhập họ tên";
    if (!form.email.trim()) e.email = "Vui lòng nhập email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email không hợp lệ";
    if (!form.password) e.password = "Vui lòng nhập mật khẩu";
    else if (form.password.length < 6) e.password = "Tối thiểu 6 ký tự";
    if (form.password !== form.confirm) e.confirm = "Mật khẩu xác nhận không khớp";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || undefined, password: form.password });
      router.replace(redirect);
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : "Đăng ký thất bại" });
    } finally { setLoading(false); }
  }

  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-slate-50 pt-[72px] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">

          <div className="text-center mb-8">
            <div className="inline-flex w-14 h-14 bg-emerald-600 rounded-2xl items-center justify-center mb-4">
              <span className="text-white text-2xl font-serif font-bold">T</span>
            </div>
            <h1 className="font-serif text-2xl text-slate-900 mb-1">Tạo tài khoản</h1>
            <p className="text-slate-500 text-sm">Quản lý đặt phòng dễ dàng hơn</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <form onSubmit={handleSubmit} noValidate className="space-y-4">

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Họ và tên *</label>
                <input value={form.name} onChange={e => setField("name", e.target.value)}
                  placeholder="Nguyễn Văn A" autoComplete="name"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow ${errors.name ? "border-red-300 bg-red-50" : "border-slate-200"}`} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email *</label>
                <input type="email" value={form.email} onChange={e => setField("email", e.target.value)}
                  placeholder="ten@email.com" autoComplete="email"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow ${errors.email ? "border-red-300 bg-red-50" : "border-slate-200"}`} />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Số điện thoại <span className="text-slate-400 font-normal">(tùy chọn)</span>
                </label>
                <input type="tel" value={form.phone} onChange={e => setField("phone", e.target.value)}
                  placeholder="0912 345 678" autoComplete="tel"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow" />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mật khẩu *</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={form.password} onChange={e => setField("password", e.target.value)}
                    placeholder="Tối thiểu 6 ký tự" autoComplete="new-password"
                    className={`w-full border rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow ${errors.password ? "border-red-300 bg-red-50" : "border-slate-200"}`} />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      {showPw
                        ? <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        : <><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>
                      }
                    </svg>
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                <PasswordStrength password={form.password} />
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Xác nhận mật khẩu *</label>
                <input type="password" value={form.confirm} onChange={e => setField("confirm", e.target.value)}
                  placeholder="Nhập lại mật khẩu" autoComplete="new-password"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow ${errors.confirm ? "border-red-300 bg-red-50" : "border-slate-200"}`} />
                {errors.confirm && <p className="text-xs text-red-500 mt-1">{errors.confirm}</p>}
              </div>

              {/* General error */}
              {errors.general && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-600">{errors.general}</p>
                </div>
              )}

              {/* Terms */}
              <p className="text-xs text-slate-400">
                Bằng cách đăng ký, bạn đồng ý với{" "}
                <Link href="/dieu-khoan-dich-vu" className="text-emerald-600 hover:underline">Điều khoản dịch vụ</Link>
                {" "}và{" "}
                <Link href="/chinh-sach-bao-mat" className="text-emerald-600 hover:underline">Chính sách bảo mật</Link>.
              </p>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
                {loading ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Đang tạo tài khoản...</>
                ) : "Tạo tài khoản"}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            Đã có tài khoản?{" "}
            <Link href="/tai-khoan/dang-nhap" className="text-emerald-600 font-semibold hover:underline">Đăng nhập</Link>
          </p>
        </div>
      </main>
    </>
  );
}
