"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ─── WMO weather code → icon + label ─────────────────────

function weatherInfo(code: number): { emoji: string; label: string } {
  if (code === 0)                    return { emoji: "☀️",  label: "Trời quang" };
  if (code <= 3)                     return { emoji: "⛅",  label: "Có mây" };
  if (code <= 48)                    return { emoji: "🌫",  label: "Sương mù" };
  if (code <= 55)                    return { emoji: "🌦",  label: "Mưa phùn" };
  if (code <= 65)                    return { emoji: "🌧",  label: "Mưa" };
  if (code <= 77)                    return { emoji: "🌨",  label: "Mưa đá" };
  if (code <= 82)                    return { emoji: "🌦",  label: "Mưa rào" };
  return                                    { emoji: "⛈",  label: "Giông bão" };
}

const CROWD_META = {
  LOW:    { label: "Thoáng",    color: "bg-emerald-400", text: "text-emerald-700", dot: "bg-emerald-400" },
  MEDIUM: { label: "Vừa phải", color: "bg-amber-400",   text: "text-amber-700",   dot: "bg-amber-400" },
  HIGH:   { label: "Đông",     color: "bg-red-400",     text: "text-red-700",     dot: "bg-red-400" },
};

// ─── Types ────────────────────────────────────────────────

type WeatherData = {
  temp: number;
  code: number;
  wind: number;
  humidity: number;
} | null;

type Event = {
  time: string;
  name: string;
  slug: string;
  emoji: string;
  price: number;
};

type Status = {
  weather: WeatherData;
  crowd: "LOW" | "MEDIUM" | "HIGH";
  notice: string;
  events: Event[];
  updatedAt: string;
};

// ─── Component ────────────────────────────────────────────

export function RealtimeBar() {
  const [status, setStatus] = useState<Status | null>(null);
  const [expanded, setExpanded] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/resort-status");
      if (res.ok) setStatus(await res.json() as Status);
    } catch {
      // fail silently — bar không bắt buộc
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 10 * 60 * 1000); // refresh 10 phút
    return () => clearInterval(id);
  }, []);

  if (!status) return null;

  const { weather, crowd, events } = status;
  const crowdMeta = CROWD_META[crowd];
  const w = weather ? weatherInfo(weather.code) : null;

  return (
    <div className="bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Compact bar */}
        <div className="flex items-center gap-6 py-2.5 overflow-x-auto scrollbar-none">

          {/* Weather */}
          {weather && w && (
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xl">{w.emoji}</span>
              <div className="text-sm">
                <span className="font-bold text-slate-800">{weather.temp}°C</span>
                <span className="text-slate-400 mx-1">·</span>
                <span className="text-slate-500">{w.label}</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                <span>💧 {weather.humidity}%</span>
                <span>💨 {weather.wind} km/h</span>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="w-px h-5 bg-slate-200 shrink-0" />

          {/* Crowd */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`w-2.5 h-2.5 rounded-full ${crowdMeta.dot} animate-pulse`}
            />
            <span className="text-sm text-slate-600">
              Resort:{" "}
              <span className={`font-semibold ${crowdMeta.text}`}>
                {crowdMeta.label}
              </span>
            </span>
          </div>

          {/* Divider */}
          {events.length > 0 && (
            <div className="w-px h-5 bg-slate-200 shrink-0" />
          )}

          {/* Admin notice */}
          {status.notice && (
            <>
              <div className="w-px h-5 bg-slate-200 shrink-0" />
              <div className="flex items-center gap-1.5 text-amber-700 text-sm shrink-0">
                <span>📢</span>
                <span className="font-medium">{status.notice}</span>
              </div>
            </>
          )}

          {/* Events */}
          {events.length > 0 && (
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-none">
              <span className="text-xs font-semibold text-slate-400 shrink-0 uppercase tracking-wide">
                Hôm nay
              </span>
              {events.map((ev) => (
                <Link
                  key={`${ev.slug}-${ev.time}`}
                  href={`/hoat-dong/${ev.slug}`}
                  className="flex items-center gap-1.5 bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 rounded-full px-3 py-1 shrink-0 transition-colors group"
                >
                  <span className="text-sm">{ev.emoji}</span>
                  <span className="text-xs font-medium text-slate-700 group-hover:text-emerald-700">
                    {ev.time} {ev.name}
                  </span>
                  {ev.price === 0 && (
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      Free
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Expand button (mobile) */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-auto shrink-0 text-xs text-slate-400 hover:text-slate-600 sm:hidden"
          >
            {expanded ? "Thu gọn" : "Xem thêm"}
          </button>
        </div>

        {/* Expanded detail (mobile) */}
        {expanded && (
          <div className="sm:hidden border-t border-slate-100 py-3 space-y-2">
            {weather && (
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <span>💧 Độ ẩm: {weather.humidity}%</span>
                <span>💨 Gió: {weather.wind} km/h</span>
              </div>
            )}
            <div className="text-xs text-slate-400">
              Cập nhật lúc{" "}
              {(() => { const d = new Date(status.updatedAt); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
