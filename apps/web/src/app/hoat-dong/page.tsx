"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ACTIVITIES, CATEGORY_META, type Category } from "@/lib/activity-data";
import { formatPrice } from "@tram-huong/shared";

type Filter = "all" | Category;

const FILTERS: { id: Filter; label: string; emoji: string }[] = [
  { id: "all", label: "Tất cả", emoji: "✨" },
  { id: "water", label: "Dưới nước", emoji: "🌊" },
  { id: "land", label: "Trên bờ", emoji: "🌿" },
  { id: "wellness", label: "Sức khoẻ", emoji: "🧘" },
  { id: "food", label: "Ẩm thực", emoji: "🍽" },
];

function formatDuration(min: number) {
  if (min < 60) return `${min} phút`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${m}` : `${h} giờ`;
}

function formatActivityPrice(price: number) {
  if (price === 0) return "Miễn phí";
  return formatPrice(price) + "/người";
}

export default function HoatDongPage() {
  const [filter, setFilter] = useState<Filter>("all");

  const shown =
    filter === "all" ? ACTIVITIES : ACTIVITIES.filter((a) => a.category === filter);

  return (
    <>
      <SiteNav />

      {/* Page hero */}
      <section className="pt-[72px] bg-gradient-to-br from-emerald-950 to-slate-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
          <p className="text-emerald-400 text-xs font-semibold tracking-[0.2em] uppercase mb-4">
            Trải nghiệm
          </p>
          <h1 className="font-serif text-4xl lg:text-5xl text-white mb-5">
            Hoạt động tại resort
          </h1>
          <p className="text-white/60 text-lg max-w-2xl leading-relaxed">
            Mỗi ngày tại Trầm Hương là một lịch trình khác nhau. Từ bình minh
            dưới nước đến đêm lửa trại — bạn chọn nhịp sống của mình.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 mt-10">
            {[
              { value: `${ACTIVITIES.length}`, label: "hoạt động" },
              { value: `${ACTIVITIES.filter((a) => a.price === 0).length}`, label: "miễn phí" },
              { value: "4", label: "danh mục" },
              { value: "Mỗi ngày", label: "hoạt động mới" },
            ].map((s) => (
              <div key={s.label} className="text-white">
                <span className="font-serif text-3xl font-bold text-emerald-300">{s.value}</span>
                <span className="text-white/50 text-sm ml-2">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="bg-amber-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">

          {/* Filter */}
          <div className="flex flex-wrap gap-2 mb-10">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border ${
                  filter === f.id
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-emerald-400 hover:text-emerald-700"
                }`}
              >
                <span>{f.emoji}</span>
                {f.label}
              </button>
            ))}
            <span className="ml-auto self-center text-sm text-slate-400">
              {shown.length} hoạt động
            </span>
          </div>

          {/* Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {shown.map((act) => {
              const cat = CATEGORY_META[act.category];
              return (
                <Link
                  key={act.slug}
                  href={`/hoat-dong/${act.slug}`}
                  className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-100 flex flex-col transition-all duration-300 hover:-translate-y-1.5"
                >
                  {/* Thumbnail */}
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={act.image}
                      alt={act.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <span className="absolute bottom-4 left-4 text-3xl">{act.emoji}</span>
                    {/* Category badge */}
                    <span
                      className={`absolute top-4 left-4 flex items-center gap-1 text-[11px] font-semibold px-3 py-1 rounded-full border ${cat.bg} ${cat.color}`}
                    >
                      {cat.emoji} {cat.label}
                    </span>
                    {/* Arrow on hover */}
                    <div className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <h2 className="font-semibold text-slate-900 text-[17px] mb-1 leading-snug">
                      {act.name}
                    </h2>
                    <p className="text-slate-400 text-sm italic mb-3">{act.tagline}</p>
                    <p className="text-slate-500 text-sm leading-relaxed flex-1 line-clamp-2 mb-5">
                      {act.description}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-4 pb-4 border-b border-slate-100">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDuration(act.duration)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                        </svg>
                        Tối đa {act.maxSlots}
                      </span>
                    </div>

                    {/* Price + CTA */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-bold text-base ${
                          act.price === 0 ? "text-emerald-600" : "text-slate-800"
                        }`}
                      >
                        {formatActivityPrice(act.price)}
                      </span>
                      <span className="px-4 py-2 text-sm font-semibold rounded-full bg-slate-50 text-slate-700 border border-slate-200 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all duration-200">
                        Xem & đặt lịch
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
