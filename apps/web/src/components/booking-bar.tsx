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

function formatDisplayDate(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function BookingBar() {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState(getTodayStr());
  const [checkOut, setCheckOut] = useState(getTomorrowStr());
  const [guests, setGuests] = useState(2);

  function handleCheckInChange(val: string) {
    setCheckIn(val);
    if (val >= checkOut) {
      const next = new Date(val + "T00:00:00");
      next.setDate(next.getDate() + 1);
      setCheckOut(next.toISOString().split("T")[0]);
    }
  }

  function handleSearch() {
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      guests: String(guests),
    });
    router.push(`/dat-phong?${params.toString()}`);
  }

  return (
    <div className="relative z-20 -mt-8 mx-auto max-w-5xl px-4">
      <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-slate-100 p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
          {/* Check-in */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
              Nhận phòng
            </span>
            <input
              type="date"
              value={checkIn}
              min={getTodayStr()}
              onChange={(e) => handleCheckInChange(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer bg-slate-50 hover:bg-white transition-colors"
            />
            <span className="text-[11px] text-slate-400 pl-1">
              {formatDisplayDate(checkIn)}
            </span>
          </label>

          {/* Check-out */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
              Trả phòng
            </span>
            <input
              type="date"
              value={checkOut}
              min={checkIn || getTodayStr()}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer bg-slate-50 hover:bg-white transition-colors"
            />
            <span className="text-[11px] text-slate-400 pl-1">
              {formatDisplayDate(checkOut)}
            </span>
          </label>

          {/* Guests */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
              Số khách
            </span>
            <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 hover:bg-white transition-colors overflow-hidden">
              <button
                type="button"
                onClick={() => setGuests((g) => Math.max(1, g - 1))}
                className="w-11 h-[46px] flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors text-lg font-light"
                aria-label="Giảm khách"
              >
                −
              </button>
              <span className="flex-1 text-center text-slate-800 text-sm font-semibold">
                {guests}
              </span>
              <button
                type="button"
                onClick={() => setGuests((g) => Math.min(12, g + 1))}
                className="w-11 h-[46px] flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors text-lg font-light"
                aria-label="Tăng khách"
              >
                +
              </button>
            </div>
            <span className="text-[11px] text-slate-400 pl-1">Tối đa 12 khách</span>
          </label>

          {/* CTA */}
          <button
            type="button"
            onClick={handleSearch}
            className="h-[46px] px-8 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl transition-colors text-sm whitespace-nowrap shadow-sm"
          >
            Kiểm tra phòng
          </button>
        </div>
      </div>
    </div>
  );
}
