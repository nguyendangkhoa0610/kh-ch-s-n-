"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { useCustomerAuth } from "@/lib/customer-auth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type Booking = {
  id: string; code: string;
  checkIn: string; checkOut: string;
  guests: number; totalAmount: number; status: string;
  notes: string | null; createdAt: string;
  room: { number: string; roomType: { name: string; slug: string } } | null;
  payment: { status: string; amount: number; method: string } | null;
};

const STATUS: Record<string, { label: string; color: string; icon: string }> = {
  PENDING:    { label: "Chờ xác nhận",  color: "bg-amber-100 text-amber-700",    icon: "⏳" },
  CONFIRMED:  { label: "Đã xác nhận",   color: "bg-blue-100 text-blue-700",      icon: "✅" },
  CHECKED_IN: { label: "Đang lưu trú",  color: "bg-emerald-100 text-emerald-700",icon: "🏡" },
  COMPLETED:  { label: "Hoàn thành",    color: "bg-slate-100 text-slate-600",    icon: "🌿" },
  CANCELLED:  { label: "Đã hủy",        color: "bg-red-100 text-red-500",        icon: "❌" },
};

function fmt(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function nights(a: string, b: string) {
  return Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

export default function MyBookingsPage() {
  const router = useRouter();
  const { user, getHeaders } = useCustomerAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [cancelling, setCancelling] = useState<string | null>(null);

  const loadBookings = useCallback(() => {
    if (!user) return;
    fetch(`${API}/bookings/my`, { headers: getHeaders() })
      .then(r => r.json() as Promise<{ data: Booking[] }>)
      .then(j => setBookings(j.data ?? []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [user, getHeaders]);

  useEffect(() => {
    if (!user) { router.replace("/tai-khoan/dang-nhap?redirect=/tai-khoan/dat-phong-cua-toi"); return; }
    loadBookings();
  }, [user, router, loadBookings]);

  async function handleCancel(bookingId: string, code: string) {
    if (!confirm(`Bạn có chắc muốn hủy booking ${code}?\n\nChính sách:\n• Hủy trước 48h: hoàn 100% đặt cọc\n• Hủy trong 24–48h: hoàn 50% đặt cọc\n• Hủy trong 24h: không hoàn đặt cọc`)) return;
    setCancelling(bookingId);
    try {
      const res = await fetch(`${API}/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: getHeaders(),
      });
      const json = await res.json() as { data?: { message: string }; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Hủy thất bại");
      alert(`✅ Đã hủy booking ${code}\n${json.data?.message ?? ""}`);
      loadBookings();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setCancelling(null);
    }
  }

  if (!user) return null;

  const filtered = filter === "all" ? bookings : bookings.filter(b => b.status === filter);

  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-slate-50 pt-[72px]">

        <div className="bg-gradient-to-br from-emerald-950 to-slate-900 py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <Link href="/tai-khoan" className="text-emerald-400 text-sm hover:underline mb-3 inline-block">
              ← Tài khoản
            </Link>
            <h1 className="font-serif text-3xl text-white">Đặt phòng của tôi</h1>
            <p className="text-white/60 text-sm mt-1">{bookings.length} đặt phòng</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8">

          {/* Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[["all", "Tất cả"], ["PENDING", "Chờ xác nhận"], ["CONFIRMED", "Đã xác nhận"],
              ["CHECKED_IN", "Đang lưu trú"], ["COMPLETED", "Hoàn thành"], ["CANCELLED", "Đã hủy"]].map(([key, label]) => (
              <button key={key} onClick={() => setFilter(key)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border-2 transition-colors ${
                  filter === key ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200 hover:border-emerald-400"
                }`}>
                {label}
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Đang tải...
            </div>
          )}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🌿</div>
              <p className="text-slate-600 font-medium mb-1">
                {filter === "all" ? "Bạn chưa có đặt phòng nào" : "Không có đặt phòng nào"}
              </p>
              <p className="text-slate-400 text-sm mb-6">
                {filter === "all" ? "Hãy bắt đầu hành trình nghỉ dưỡng tại Trầm Hương" : "Thử chọn bộ lọc khác"}
              </p>
              {filter === "all" && (
                <Link href="/dat-phong"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-full transition-colors">
                  Đặt phòng ngay
                </Link>
              )}
            </div>
          )}

          {/* Booking list */}
          {!loading && filtered.length > 0 && (
            <div className="space-y-4">
              {filtered.map(b => {
                const st = STATUS[b.status] ?? STATUS.PENDING;
                const n = nights(b.checkIn, b.checkOut);
                return (
                  <div key={b.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{st.icon}</span>
                        <div>
                          <p className="font-mono text-sm font-bold text-emerald-700">{b.code}</p>
                          <p className="text-xs text-slate-400">Đặt ngày {fmtDate(b.createdAt)}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${st.color}`}>{st.label}</span>
                    </div>

                    {/* Body */}
                    <div className="px-5 py-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-800">
                            {b.room?.roomType.name ?? "Chưa assign phòng"}
                            {b.room?.number && <span className="text-slate-400 font-normal text-sm"> · Phòng {b.room.number}</span>}
                          </p>
                          <p className="text-sm text-slate-500 mt-1">
                            {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}
                            <span className="mx-2 text-slate-300">·</span>
                            {n} đêm · {b.guests} khách
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-slate-900">{fmt(b.totalAmount)}</p>
                          <p className="text-xs text-slate-400">Đặt cọc {fmt(Math.round(b.totalAmount * 0.3))}</p>
                        </div>
                      </div>

                      {b.notes && (
                        <p className="mt-3 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 italic">"{b.notes}"</p>
                      )}
                    </div>

                    {/* Footer */}
                    {(b.status === "CONFIRMED" || b.status === "CHECKED_IN") && (
                      <div className="px-5 py-3 border-t border-slate-100 bg-emerald-50">
                        <p className="text-xs text-emerald-700">
                          💡 Sử dụng mã <span className="font-mono font-bold">{b.code}</span> để đăng nhập app khách và dùng Digital Key.
                        </p>
                      </div>
                    )}
                    {/* Link xem vé / in */}
                    <div className="px-5 py-2 border-t border-slate-100 flex items-center justify-between">
                      <Link href={`/dat-phong/xac-nhan/${b.code}`}
                        className="text-xs text-emerald-600 font-semibold hover:underline">
                        🎫 Xem & in vé
                      </Link>
                    </div>

                    {/* Nút hủy — chỉ cho PENDING và CONFIRMED */}
                    {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                      <div className="px-5 py-3 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={() => handleCancel(b.id, b.code)}
                          disabled={cancelling === b.id}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors disabled:opacity-50"
                        >
                          {cancelling === b.id ? "Đang hủy..." : "Hủy đặt phòng"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-center mt-10">
            <Link href="/dat-phong"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white font-semibold text-sm rounded-full transition-colors">
              + Đặt phòng mới
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
