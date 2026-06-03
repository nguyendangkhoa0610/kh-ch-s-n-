"use client";

import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTHS = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];

function getMonthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function AvailabilityCalendar({ slug }: { slug: string }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [unavailable, setUnavailable] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const month = getMonthKey(currentDate);
    setLoading(true);
    fetch(`${API}/rooms/availability?slug=${slug}&month=${month}`)
      .then(r => r.json())
      .then((j: { data: { unavailable: string[] } }) => {
        setUnavailable(new Set(j.data?.unavailable ?? []));
      })
      .catch(() => setUnavailable(new Set()))
      .finally(() => setLoading(false));
  }, [currentDate, slug]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function isUnavailable(day: number) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return unavailable.has(key);
  }

  function isPast(day: number) {
    const d = new Date(year, month, day);
    return d < today;
  }

  function prevMonth() {
    setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  function nextMonth() {
    setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800 text-sm">Lịch phòng trống</h3>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} disabled={isCurrentMonth}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-colors">
            ‹
          </button>
          <span className="text-sm font-medium text-slate-700 w-24 text-center">
            {MONTHS[month]} {year}
          </span>
          <button onClick={nextMonth}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
            ›
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-semibold text-slate-400 py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />;
              const past = isPast(day);
              const booked = isUnavailable(day);
              return (
                <div key={day} className={`
                  aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-colors
                  ${past ? "text-slate-300 cursor-not-allowed" :
                    booked ? "bg-red-50 text-red-400 cursor-not-allowed" :
                    "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}
                `}>
                  {day}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-200" />
              Còn phòng
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="w-3 h-3 rounded bg-red-50 border border-red-200" />
              Hết phòng
            </div>
          </div>
        </>
      )}
    </div>
  );
}
