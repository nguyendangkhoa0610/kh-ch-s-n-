import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type BookingDetail = {
  code: string; status: string;
  checkIn: string; checkOut: string; guests: number; totalAmount: number;
  notes: string | null; createdAt: string;
  user: { name: string; email: string; phone: string };
  room: { number: string; roomType: { name: string; slug: string } } | null;
  payment: { status: string; amount: number; method: string } | null;
};

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("vi-VN", {
    weekday: "long", day: "2-digit", month: "2-digit", year: "numeric",
  });
}
function fmtVND(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}
function nights(a: string, b: string) {
  return Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xác nhận", CONFIRMED: "Đã xác nhận",
  CHECKED_IN: "Đang lưu trú", COMPLETED: "Hoàn thành", CANCELLED: "Đã hủy",
};
const METHOD_LABELS: Record<string, string> = {
  VNPAY: "VNPay", MOMO: "MoMo", ZALOPAY: "ZaloPay", CASH: "Tiền mặt",
};
const PAY_STATUS: Record<string, string> = {
  PENDING: "Chờ thanh toán", SUCCESS: "Đã thanh toán", FAILED: "Thất bại",
};

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return { title: `Xác nhận đặt phòng ${code} — Trầm Hương Eco-Resort` };
}

export default async function BookingConfirmPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  let booking: BookingDetail | null = null;
  try {
    const res = await fetch(`${API}/bookings/by-code/${code.toUpperCase()}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const json = await res.json() as { data: BookingDetail };
      booking = json.data;
    }
  } catch { /* not found */ }

  if (!booking) notFound();

  const n = nights(booking.checkIn, booking.checkOut);
  const deposit = Math.round(booking.totalAmount * 0.3);

  return (
    <>
      {/* Hide nav when printing */}
      <div className="print:hidden">
        <SiteNav />
      </div>

      <main className="min-h-screen bg-slate-50 pt-[72px] print:pt-0 print:bg-white px-4 py-8">
        <div className="max-w-2xl mx-auto">

          {/* Print + Share actions */}
          <div className="flex items-center justify-between mb-6 print:hidden">
            <Link href="/tai-khoan/dat-phong-cua-toi" className="text-sm text-slate-500 hover:text-emerald-600">
              ← Đặt phòng của tôi
            </Link>
            <div className="flex gap-2">
              <button onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:border-emerald-400 transition-colors">
                🖨️ In vé
              </button>
              <button onClick={() => navigator.share?.({ title: `Booking ${booking!.code}`, url: window.location.href }).catch(() => {})}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors">
                📤 Chia sẻ
              </button>
            </div>
          </div>

          {/* Ticket */}
          <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden print:shadow-none print:border print:rounded-none">

            {/* Header */}
            <div className="bg-emerald-900 px-8 py-7 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-emerald-300 text-xs font-semibold tracking-widest uppercase mb-2">
                    Trầm Hương Eco-Resort · Bình Định
                  </p>
                  <h1 className="font-serif text-3xl font-bold mb-1">Xác nhận đặt phòng</h1>
                  <p className="text-emerald-200 text-sm">Cảm ơn bạn đã chọn Trầm Hương!</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-300 text-xs mb-1">Mã đặt phòng</p>
                  <p className="font-mono text-2xl font-bold bg-emerald-700 px-4 py-2 rounded-xl">
                    {booking.code}
                  </p>
                </div>
              </div>
            </div>

            {/* Status badge */}
            <div className="px-8 py-3 bg-emerald-50 border-b border-emerald-100">
              <span className="text-xs font-semibold text-emerald-700">
                Trạng thái: {STATUS_LABELS[booking.status] ?? booking.status}
              </span>
            </div>

            {/* Booking info */}
            <div className="px-8 py-6">
              <div className="grid sm:grid-cols-2 gap-6">

                {/* Guest */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Thông tin khách</p>
                  <div className="space-y-1.5 text-sm">
                    <div><span className="text-slate-500">Họ tên:</span> <strong className="text-slate-800">{booking.user.name}</strong></div>
                    <div><span className="text-slate-500">Email:</span> <span className="text-slate-700">{booking.user.email}</span></div>
                    <div><span className="text-slate-500">Điện thoại:</span> <span className="text-slate-700">{booking.user.phone}</span></div>
                    <div><span className="text-slate-500">Số khách:</span> <span className="text-slate-700">{booking.guests} người</span></div>
                  </div>
                </div>

                {/* Room */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Phòng</p>
                  <div className="space-y-1.5 text-sm">
                    <div><strong className="text-slate-800 text-base">{booking.room?.roomType.name ?? "Chưa assign"}</strong></div>
                    {booking.room?.number && (
                      <div><span className="text-slate-500">Số phòng:</span> <span className="text-slate-700">{booking.room.number}</span></div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="mt-6 p-5 bg-slate-50 rounded-2xl">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Nhận phòng</p>
                    <p className="font-semibold text-slate-800 text-sm leading-snug">{fmtDate(booking.checkIn)}</p>
                    <p className="text-xs text-emerald-600 font-medium mt-1">14:00</p>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <p className="font-serif text-2xl font-bold text-emerald-700">{n}</p>
                    <p className="text-xs text-slate-400">đêm</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Trả phòng</p>
                    <p className="font-semibold text-slate-800 text-sm leading-snug">{fmtDate(booking.checkOut)}</p>
                    <p className="text-xs text-emerald-600 font-medium mt-1">12:00</p>
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tổng tiền phòng</span>
                  <span className="font-semibold text-slate-800">{fmtVND(booking.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Đặt cọc 30%</span>
                  <span className="font-semibold text-emerald-700">{fmtVND(deposit)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400 pt-1 border-t border-slate-100">
                  <span>Còn lại khi check-in</span>
                  <span>{fmtVND(booking.totalAmount - deposit)}</span>
                </div>
                {booking.payment && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Phương thức thanh toán</span>
                    <span className="text-slate-600">
                      {METHOD_LABELS[booking.payment.method] ?? booking.payment.method} ·{" "}
                      {PAY_STATUS[booking.payment.status] ?? booking.payment.status}
                    </span>
                  </div>
                )}
              </div>

              {booking.notes && (
                <div className="mt-4 bg-amber-50 rounded-xl px-4 py-3 text-sm text-amber-700">
                  <strong>Ghi chú:</strong> {booking.notes}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-5 bg-emerald-950 text-white">
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-emerald-300 font-semibold mb-2">Chính sách</p>
                  <ul className="space-y-1 text-emerald-200/80 text-xs">
                    <li>• Hủy trước 48h: hoàn 100% đặt cọc</li>
                    <li>• Hủy trong 24–48h: hoàn 50% đặt cọc</li>
                    <li>• Hủy trong 24h: không hoàn đặt cọc</li>
                  </ul>
                </div>
                <div>
                  <p className="text-emerald-300 font-semibold mb-2">Liên hệ</p>
                  <p className="text-emerald-200/80 text-xs">
                    📞 0932 183 605 (Lễ tân 24/7)<br />
                    ✉️ hello@tramhuong-resort.vn<br />
                    📍 Xã Cát Khánh, Phù Cát, Bình Định
                  </p>
                </div>
              </div>
              <p className="text-emerald-400 text-[10px] mt-4">
                Xuất ngày {new Date().toLocaleDateString("vi-VN")} · Vé này có giá trị xác nhận đặt phòng tại Trầm Hương Eco-Resort
              </p>
            </div>
          </div>

          {/* Back button */}
          <div className="text-center mt-6 print:hidden">
            <Link href="/dat-phong/tra-cuu" className="text-sm text-slate-400 hover:text-slate-600">
              Tra cứu đặt phòng khác →
            </Link>
          </div>
        </div>
      </main>

      <style>{`
        @media print {
          @page { margin: 1cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </>
  );
}
