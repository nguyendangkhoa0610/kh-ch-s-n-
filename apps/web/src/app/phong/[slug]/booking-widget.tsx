"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}
function getTomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

type Props = {
  slug: string;
  capacity: number;
  pricePerNight: number;
};

function calcNights(a: string, b: string) {
  return Math.max(0, Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000));
}
function fmtVND(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

export function BookingWidget({ slug, capacity, pricePerNight }: Props) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState(getTodayStr());
  const [checkOut, setCheckOut] = useState(getTomorrowStr());
  const [guests, setGuests] = useState(Math.min(2, capacity));

  const nights = calcNights(checkIn, checkOut);
  const total = nights * pricePerNight;
  const deposit = Math.round(total * 0.3);

  function handleCheckInChange(val: string) {
    setCheckIn(val);
    if (val >= checkOut) {
      const next = new Date(val + "T00:00:00");
      next.setDate(next.getDate() + 1);
      setCheckOut(next.toISOString().split("T")[0]);
    }
  }

  function handleBook() {
    const params = new URLSearchParams({ checkIn, checkOut, guests: String(guests), room: slug });
    router.push(`/dat-phong?${params.toString()}`);
  }

  return (
    <div className="p-7 space-y-4">
      <label className="block">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
          Nhận phòng
        </span>
        <input
          type="date"
          value={checkIn}
          min={getTodayStr()}
          onChange={(e) => handleCheckInChange(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 cursor-pointer"
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
          Trả phòng
        </span>
        <input
          type="date"
          value={checkOut}
          min={checkIn}
          onChange={(e) => setCheckOut(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 cursor-pointer"
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
          Số khách
        </span>
        <select
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
        >
          {Array.from({ length: capacity }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n} khách</option>
          ))}
        </select>
      </label>

      {/* Price estimate */}
      {nights > 0 && (
        <div className="bg-slate-50 rounded-xl px-4 py-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>{fmtVND(pricePerNight)} × {nights} đêm</span>
            <span className="font-semibold text-slate-800">{fmtVND(total)}</span>
          </div>
          <div className="flex justify-between text-slate-400 text-xs border-t border-slate-200 pt-1.5">
            <span>Đặt cọc ngay (30%)</span>
            <span className="text-emerald-600 font-semibold">{fmtVND(deposit)}</span>
          </div>
        </div>
      )}

      <button
        onClick={handleBook}
        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl transition-colors text-sm"
      >
        Đặt phòng ngay
      </button>

      <p className="text-center text-xs text-slate-400">
        Hủy miễn phí trước 48h · Xác nhận qua email
      </p>
    </div>
  );
}
