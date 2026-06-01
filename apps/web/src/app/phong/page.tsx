"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ROOM_TYPES } from "@/lib/room-data";
import { formatPrice } from "@tram-huong/shared";

type Filter = "all" | "budget" | "mid" | "premium";

const FILTERS: { id: Filter; label: string; range: string }[] = [
  { id: "all", label: "Tất cả", range: "" },
  { id: "budget", label: "Tiết kiệm", range: "< 2 triệu / đêm" },
  { id: "mid", label: "Tầm trung", range: "2 – 5 triệu / đêm" },
  { id: "premium", label: "Cao cấp", range: "> 5 triệu / đêm" },
];

function applyFilter(filter: Filter) {
  return ROOM_TYPES.filter((r) => {
    if (filter === "budget") return r.price < 2_000_000;
    if (filter === "mid") return r.price >= 2_000_000 && r.price <= 5_000_000;
    if (filter === "premium") return r.price > 5_000_000;
    return true;
  });
}

function PersonIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
    </svg>
  );
}

function SizeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
    </svg>
  );
}

export default function PhongPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const rooms = applyFilter(filter);

  return (
    <>
      <SiteNav />

      {/* Page hero */}
      <section className="pt-[72px] bg-emerald-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
          <p className="text-emerald-400 text-xs font-semibold tracking-[0.2em] uppercase mb-4">
            Chỗ nghỉ
          </p>
          <h1 className="font-serif text-4xl lg:text-5xl text-white mb-5">
            Phòng & Bungalow
          </h1>
          <p className="text-white/60 text-lg max-w-2xl leading-relaxed">
            Từ lều glamping tiết kiệm đến suite trầm hương xa xỉ — mỗi không
            gian là một trải nghiệm riêng biệt, tất cả đều giữa thiên nhiên
            thuần khiết.
          </p>
        </div>
      </section>

      {/* Filter + Grid */}
      <main className="bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2 mb-10">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border ${
                  filter === f.id
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-emerald-400 hover:text-emerald-700"
                }`}
              >
                {f.label}
                {f.range && (
                  <span
                    className={`ml-1.5 text-[11px] font-normal ${
                      filter === f.id ? "text-emerald-200" : "text-slate-400"
                    }`}
                  >
                    ({f.range})
                  </span>
                )}
              </button>
            ))}
            <span className="ml-auto self-center text-sm text-slate-400">
              {rooms.length} loại phòng
            </span>
          </div>

          {/* Room grid */}
          {rooms.length === 0 ? (
            <div className="text-center py-24 text-slate-400">
              Không có phòng phù hợp với bộ lọc này.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <Link
                  key={room.slug}
                  href={`/phong/${room.slug}`}
                  className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-100 flex flex-col transition-all duration-300 hover:-translate-y-1.5"
                >
                  {/* Thumbnail */}
                  <div
                    className={`relative h-56 bg-gradient-to-br ${room.gradient} flex items-center justify-center`}
                  >
                    {/* Placeholder house SVG */}
                    <svg
                      className="w-20 h-20 text-white/15"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={0.75}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                      />
                    </svg>

                    {room.badge && (
                      <span className="absolute top-4 left-4 bg-amber-400 text-amber-900 text-[11px] font-semibold px-3 py-1 rounded-full">
                        {room.badge}
                      </span>
                    )}

                    {/* Arrow on hover */}
                    <div className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <p className="text-emerald-600 text-[11px] font-semibold tracking-wider uppercase mb-1.5">
                      {room.view}
                    </p>
                    <h2 className="font-serif text-[19px] font-semibold text-slate-900 mb-1 leading-snug">
                      {room.name}
                    </h2>
                    <p className="text-slate-500 text-sm italic mb-4">
                      {room.tagline}
                    </p>

                    <p className="text-slate-500 text-sm leading-relaxed flex-1 mb-5 line-clamp-2">
                      {room.description}
                    </p>

                    {/* Stats row */}
                    <div className="flex items-center gap-5 text-sm text-slate-500 mb-5 pb-5 border-b border-slate-100">
                      <span className="flex items-center gap-1.5">
                        <PersonIcon />
                        {room.capacity} khách
                      </span>
                      <span className="flex items-center gap-1.5">
                        <SizeIcon />
                        {room.size} m²
                      </span>
                    </div>

                    {/* Price + CTA */}
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[11px] text-slate-400">từ</p>
                        <p className="text-emerald-700 font-bold text-lg leading-tight">
                          {formatPrice(room.price)}
                        </p>
                        <p className="text-[11px] text-slate-400">/đêm</p>
                      </div>
                      <span className="px-4 py-2 text-sm font-semibold rounded-full bg-slate-50 text-slate-700 border border-slate-200 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all duration-200">
                        Xem chi tiết
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
