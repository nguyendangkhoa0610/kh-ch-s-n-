"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { useCustomerAuth } from "@/lib/customer-auth";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, updateProfile } = useCustomerAuth();

  const [tab, setTab] = useState<"profile" | "password">("profile");
  const [form, setForm] = useState({ name: "", phone: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) { router.replace("/tai-khoan/dang-nhap?redirect=/tai-khoan"); return; }
    setForm({ name: user.name, phone: user.phone ?? "" });
  }, [user, router]);

  if (!user) return null;

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Vui lòng nhập họ tên"); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      await updateProfile({ name: form.name.trim(), phone: form.phone.trim() || undefined });
      setSuccess("Cập nhật thông tin thành công!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cập nhật thất bại");
    } finally { setSaving(false); }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!pwForm.currentPassword) { setError("Vui lòng nhập mật khẩu hiện tại"); return; }
    if (pwForm.newPassword.length < 6) { setError("Mật khẩu mới tối thiểu 6 ký tự"); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { setError("Mật khẩu xác nhận không khớp"); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      await updateProfile({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setSuccess("Đổi mật khẩu thành công!");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đổi mật khẩu thất bại");
    } finally { setSaving(false); }
  }

  function handleLogout() {
    logout();
    router.replace("/");
  }

  const ROLE_LABEL: Record<string, string> = { GUEST: "Khách hàng", STAFF: "Nhân viên", MANAGER: "Quản lý", ADMIN: "Admin" };

  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-slate-50 pt-[72px]">

        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-950 to-slate-900 py-12 px-6">
          <div className="max-w-4xl mx-auto flex items-center gap-5">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {user.name[0].toUpperCase()}
            </div>
            <div>
              <h1 className="font-serif text-2xl text-white">{user.name}</h1>
              <p className="text-emerald-300 text-sm">{user.email}</p>
              <span className="inline-block mt-1 text-xs bg-emerald-800 text-emerald-300 px-2.5 py-0.5 rounded-full">
                {ROLE_LABEL[user.role] ?? user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Eco Points banner */}
        {(user.ecoPoints ?? 0) > 0 && (
          <div className="max-w-4xl mx-auto px-6 pt-6">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-700 rounded-2xl px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-emerald-200 text-xs font-semibold uppercase tracking-wide mb-0.5">Eco Points của bạn</p>
                <p className="text-white text-2xl font-bold">{user.ecoPoints?.toLocaleString('vi-VN')} <span className="text-emerald-300 text-sm font-medium">điểm xanh</span></p>
                <p className="text-emerald-300 text-xs mt-1">Mở app Trầm Hương để đổi điểm lấy ưu đãi</p>
              </div>
              <div className="text-4xl">🌿</div>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="grid md:grid-cols-[240px_1fr] gap-6">

            {/* Sidebar */}
            <aside className="space-y-2">
              <Link href="/tai-khoan/yeu-thich"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                Phòng yêu thích
              </Link>
              <Link href="/tai-khoan/dat-phong-cua-toi"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                Đặt phòng của tôi
              </Link>
              <button onClick={() => { setTab("profile"); setError(""); setSuccess(""); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${tab === "profile" ? "bg-white shadow-sm border border-slate-200 text-emerald-700" : "text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200"}`}>
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                Thông tin cá nhân
              </button>
              <button onClick={() => { setTab("password"); setError(""); setSuccess(""); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${tab === "password" ? "bg-white shadow-sm border border-slate-200 text-emerald-700" : "text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200"}`}>
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                Đổi mật khẩu
              </button>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                Đăng xuất
              </button>
            </aside>

            {/* Content */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

              {/* Feedback */}
              {success && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-5">
                  <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-emerald-700">{success}</p>
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
                  <svg className="w-4 h-4 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {tab === "profile" && (
                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <h2 className="font-semibold text-slate-900 text-lg mb-1">Thông tin cá nhân</h2>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Họ và tên</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                    <input value={user.email} disabled
                      className="w-full border border-slate-100 rounded-xl px-4 py-3 text-sm bg-slate-50 text-slate-400 cursor-not-allowed" />
                    <p className="text-xs text-slate-400 mt-1">Email không thể thay đổi</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Số điện thoại</label>
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="0912 345 678"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <button type="submit" disabled={saving}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors">
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </form>
              )}

              {tab === "password" && (
                <form onSubmit={handleChangePassword} className="space-y-5">
                  <h2 className="font-semibold text-slate-900 text-lg mb-1">Đổi mật khẩu</h2>
                  {(["currentPassword", "newPassword", "confirmPassword"] as const).map((key, i) => (
                    <div key={key}>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        {["Mật khẩu hiện tại", "Mật khẩu mới", "Xác nhận mật khẩu mới"][i]}
                      </label>
                      <input type="password" value={pwForm[key]} onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder="••••••••"
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                  ))}
                  <button type="submit" disabled={saving}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors">
                    {saving ? "Đang đổi..." : "Đổi mật khẩu"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
