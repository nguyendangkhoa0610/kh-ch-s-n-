"use client";

import { useState } from "react";

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

type Props = {
  activityName: string;
  schedules: string[];
  maxSlots: number;
  price: number;
};

const ZALO_NUMBER = "0932183605";

export function ActivityBookingWidget({ activityName, schedules, maxSlots, price }: Props) {
  const [selectedTime, setSelectedTime] = useState<string>(schedules[0] ?? "");
  const [date, setDate] = useState(getTodayStr());
  const [guests, setGuests] = useState(1);

  function handleBook() {
    const dateLabel = new Date(date + "T00:00:00").toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const msg = `Xin chào, tôi muốn đặt hoạt động "${activityName}" - Ngày ${dateLabel}, buổi ${selectedTime}, ${guests} người.`;
    const url = `https://zalo.me/${ZALO_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="p-7 space-y-5">
      {/* Schedule picker */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Chọn buổi
        </p>
        <div className="grid grid-cols-2 gap-2">
          {schedules.map((time) => (
            <button
              key={time}
              type="button"
              onClick={() => setSelectedTime(time)}
              className={`border rounded-xl py-2.5 text-sm font-medium transition-colors ${
                selectedTime === time
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 text-slate-700 hover:border-emerald-400 hover:text-emerald-600"
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      </div>

      {/* Date */}
      <label className="block">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
          Ngày
        </span>
        <input
          type="date"
          value={date}
          min={getTodayStr()}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 cursor-pointer"
        />
      </label>

      {/* Guests */}
      <label className="block">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
          Số người
        </span>
        <select
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
        >
          {Array.from({ length: Math.min(maxSlots, 8) }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n} người</option>
          ))}
        </select>
      </label>

      {/* Price estimate */}
      {price > 0 && guests > 0 && (
        <div className="bg-emerald-50 rounded-xl px-4 py-3 flex justify-between text-sm">
          <span className="text-slate-600">Ước tính ({guests} người)</span>
          <span className="font-bold text-emerald-700">
            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price * guests)}
          </span>
        </div>
      )}

      <button
        onClick={handleBook}
        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
      >
        <span>💬</span>
        Đặt lịch qua Zalo
      </button>

      <p className="text-center text-xs text-slate-400">
        Hủy miễn phí trước 24h · Thanh toán tại resort
      </p>
    </div>
  );
}
