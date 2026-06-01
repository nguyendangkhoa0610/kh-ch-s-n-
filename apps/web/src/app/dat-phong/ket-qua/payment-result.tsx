"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@tram-huong/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type VerifyResult = {
  valid: boolean;
  success: boolean;
  bookingCode: string;
  amount: number;
  message: string;
  booking?: {
    code: string;
    checkIn: string;
    checkOut: string;
    totalAmount: number;
    user: { name: string; email: string };
    room: { number: string; roomType: { name: string } } | null;
  } | null;
};

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function PaymentResult() {
  const params = useSearchParams();
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const query = params.toString();
    if (!query) {
      setLoading(false);
      return;
    }

    fetch(`${API_BASE}/payments/vnpay/verify?${query}`)
      .then((r) => r.json())
      .then((j: { data: VerifyResult }) => setResult(j.data))
      .catch(() =>
        setResult({
          valid: false,
          success: false,
          bookingCode: "",
          amount: 0,
          message: "Không thể xác minh giao dịch.",
        })
      )
      .finally(() => setLoading(false));
  }, [params]);

  if (loading) {
    return (
      <div className="flex flex-col items-center py-20 text-slate-400 gap-3">
        <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm">Đang xác minh giao dịch với VNPay...</p>
      </div>
    );
  }

  if (!result || !params.has("vnp_ResponseCode")) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
          🔗
        </div>
        <h2 className="font-serif text-2xl text-slate-900 mb-2">Trang kết quả thanh toán</h2>
        <p className="text-slate-500 text-sm mb-6">
          Trang này hiển thị sau khi bạn hoàn thành thanh toán qua VNPay.
        </p>
        <Link href="/dat-phong" className="text-emerald-600 font-semibold hover:underline text-sm">
          ← Quay lại đặt phòng
        </Link>
      </div>
    );
  }

  if (result.success) {
    return (
      <div>
        {/* Success */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="font-serif text-3xl text-slate-900 mb-2">Thanh toán thành công!</h2>
          <p className="text-slate-500">
            {result.message} · Đặt cọc{" "}
            <span className="font-semibold text-emerald-700">
              {formatPrice(result.amount)}
            </span>{" "}
            đã được ghi nhận.
          </p>
        </div>

        {/* Booking detail */}
        {result.booking && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Mã đặt phòng
              </span>
              <span className="font-mono font-bold text-emerald-700 text-lg bg-emerald-50 px-3 py-1 rounded-lg">
                {result.booking.code}
              </span>
            </div>
            <div className="text-sm space-y-2 text-slate-600">
              <p>
                <span className="font-medium">Phòng:</span>{" "}
                {result.booking.room
                  ? `${result.booking.room.number} · ${result.booking.room.roomType.name}`
                  : "Sẽ được assign sớm"}
              </p>
              <p>
                <span className="font-medium">Nhận phòng:</span>{" "}
                {formatDate(result.booking.checkIn)}
              </p>
              <p>
                <span className="font-medium">Trả phòng:</span>{" "}
                {formatDate(result.booking.checkOut)}
              </p>
              <p>
                <span className="font-medium">Khách:</span>{" "}
                {result.booking.user.name}
              </p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 text-sm text-amber-800">
              📧 Email xác nhận đã gửi đến{" "}
              <span className="font-semibold">{result.booking.user.email}</span>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Link
            href="/"
            className="flex-1 py-3 border-2 border-slate-200 text-slate-600 font-semibold rounded-xl text-center text-sm hover:border-slate-300 transition-colors"
          >
            Về trang chủ
          </Link>
          <Link
            href="/hoat-dong"
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-center text-sm transition-colors"
          >
            Xem hoạt động
          </Link>
        </div>
      </div>
    );
  }

  // Failed / cancelled
  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
        <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="font-serif text-2xl text-slate-900 mb-2">
        {result.message.includes("hủy") ? "Giao dịch đã hủy" : "Thanh toán thất bại"}
      </h2>
      <p className="text-slate-500 text-sm mb-2">{result.message}</p>
      {result.bookingCode && (
        <p className="text-xs text-slate-400 mb-8">
          Booking <span className="font-mono font-semibold">{result.bookingCode}</span> vẫn được giữ trong 24h.
        </p>
      )}
      <div className="flex flex-col gap-3">
        <Link
          href="/dat-phong"
          className="py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors"
        >
          Thử lại thanh toán
        </Link>
        <Link href="/" className="py-3 text-slate-500 text-sm hover:text-slate-700">
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
