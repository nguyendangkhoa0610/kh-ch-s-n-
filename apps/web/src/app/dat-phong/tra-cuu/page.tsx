"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type BookingDetail = {
  id: string;
  code: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  status: string;
  notes: string | null;
  createdAt: string;
  user: { name: string; email: string; phone: string };
  room: { number: string; roomType: { name: string; slug: string } } | null;
};

const STATUS_META: Record<string, { label: string; color: string; icon: string; desc: string }> = {
  PENDING:    { label: "Chờ xác nhận",  color: "bg-amber-100 text-amber-700 border-amber-200",   icon: "⏳", desc: "Chúng tôi đang xác nhận đặt phòng của bạn." },
  CONFIRMED:  { label: "Đã xác nhận",   color: "bg-blue-100 text-blue-700 border-blue-200",      icon: "✅", desc: "Đặt phòng đã được xác nhận. Hẹn gặp bạn!" },
  CHECKED_IN: { label: "Đang lưu trú",  color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "🏡", desc: "Chào mừng đến Trầm Hương!" },
  COMPLETED:  { label: "Đã hoàn thành", color: "bg-slate-100 text-slate-600 border-slate-200",   icon: "🌿", desc: "Cảm ơn bạn đã lưu trú. Hẹn gặp lại!" },
  CANCELLED:  { label: "Đã hủy",        color: "bg-red-100 text-red-500 border-red-200",         icon: "❌", desc: "Đặt phòng này đã được hủy." },
};

function formatPrice(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("vi-VN", {
    weekday: "long", day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function calcNights(checkIn: string, checkOut: string) {
  return Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000);
}

export default function TraCuuPage() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState(searchParams.get("code") ?? "");
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const c = searchParams.get("code");
    if (c) { setCode(c.toUpperCase()); }
  }, [searchParams]);

  async function handleSearch() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setError("Vui lòng nhập mã đặt phòng"); return; }
    setLoading(true); setError(""); setBooking(null);
    try {
      const res = await fetch(`${API_BASE}/bookings/by-code/${trimmed}`);
      if (res.status === 404) { setError("Không tìm thấy đặt phòng với mã này."); return; }
      if (!res.ok) throw new Error("Lỗi server");
      const json = await res.json() as { data: BookingDetail };
      setBooking(json.data);
    } catch {
      setError("Không kết nối được server. Vui lòng thử lại.");
    } finally { setLoading(false); }
  }

  const nights = booking ? calcNights(booking.checkIn, booking.checkOut) : 0;
  const meta = booking ? (STATUS_META[booking.status] ?? STATUS_META.PENDING) : null;
  const deposit = booking ? Math.round(booking.totalAmount * 0.3) : 0;

  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-slate-50 pt-[72px]">

        {/* Hero */}
        <section className="bg-gradient-to-br from-emerald-950 to-slate-900 py-14 px-6">
          <div className="max-w-xl mx-auto text-center">
            <p className="text-emerald-400 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
              Tra cứu đặt phòng
            </p>
            <h1 className="font-serif text-3xl lg:text-4xl text-white mb-3">
              Kiểm tra trạng thái
            </h1>
            <p className="text-white/60 text-sm">
              Nhập mã đặt phòng nhận được qua email để xem chi tiết.
            </p>
          </div>
        </section>

        <div className="max-w-xl mx-auto px-6 py-10">

          {/* Search box */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Mã đặt phòng
            </label>
            <div className="flex gap-3">
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="VD: TH20260601234"
                maxLength={20}
                className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-semibold text-emerald-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors whitespace-nowrap"
              >
                {loading ? "..." : "Tra cứu"}
              </button>
            </div>
            {error && (
              <p className="mt-3 text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
            <p className="mt-3 text-xs text-slate-400">
              Mã đặt phòng được gửi qua email xác nhận sau khi đặt phòng thành công.
            </p>
          </div>

          {/* Result */}
          {booking && meta && (
            <div className="space-y-4">

              {/* Status banner */}
              <div className={`rounded-2xl border p-5 ${meta.color}`}>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-2xl">{meta.icon}</span>
                  <div>
                    <p className="font-bold text-base">{meta.label}</p>
                    <p className="text-sm opacity-80">{meta.desc}</p>
                  </div>
                </div>
              </div>

              {/* Booking details */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Chi tiết đặt phòng</p>
                  <span className="font-mono text-sm font-bold text-emerald-700">{booking.code}</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {[
                    ["Khách", booking.user.name],
                    ["Email", booking.user.email],
                    ["Điện thoại", booking.user.phone],
                    ["Loại phòng", booking.room?.roomType.name ?? "Chưa assign"],
                    ["Số phòng", booking.room?.number ?? "—"],
                    ["Nhận phòng", formatDate(booking.checkIn) + " · 14:00"],
                    ["Trả phòng", formatDate(booking.checkOut) + " · 12:00"],
                    ["Thời gian", `${nights} đêm · ${booking.guests} khách`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex px-5 py-3 text-sm">
                      <span className="text-slate-400 w-32 shrink-0">{k}</span>
                      <span className="text-slate-800 font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Thanh toán</p>
                </div>
                <div className="p-5 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Tổng tiền phòng</span>
                    <span className="font-semibold text-slate-800">{formatPrice(booking.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Đặt cọc 30%</span>
                    <span className="font-semibold text-emerald-700">{formatPrice(deposit)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-xs pt-1 border-t border-slate-100">
                    <span>Còn lại thanh toán khi check-in</span>
                    <span>{formatPrice(booking.totalAmount - deposit)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {booking.notes && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-800">
                  <p className="font-semibold mb-1">Ghi chú</p>
                  <p>{booking.notes}</p>
                </div>
              )}

              {/* CTA */}
              <div className="flex gap-3">
                <Link href="/dat-phong"
                  className="flex-1 py-3 text-center text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors">
                  Đặt phòng mới
                </Link>
                <Link href="/hoat-dong"
                  className="flex-1 py-3 text-center text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors">
                  Xem hoạt động
                </Link>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!booking && !loading && !error && (
            <div className="text-center py-12 text-slate-400">
              <div className="text-5xl mb-3">🔍</div>
              <p className="text-sm">Nhập mã đặt phòng ở trên để tra cứu</p>
              <p className="text-xs mt-1">Mã có dạng: TH + ngày + số ngẫu nhiên</p>
            </div>
          )}

        </div>
      </main>
      <SiteFooter />
    </>
  );
}
