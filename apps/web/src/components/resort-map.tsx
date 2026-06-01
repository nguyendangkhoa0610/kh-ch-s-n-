"use client";

import { useState } from "react";
import Link from "next/link";

// ─── POI Data ────────────────────────────────────────────

type Category = "room" | "food" | "wellness" | "utility" | "nature";

type POI = {
  id: string;
  label: string;
  category: Category;
  emoji: string;
  desc: string;
  x: number; // % from left
  y: number; // % from top
  link?: string;
};

const CATEGORY_META: Record<Category, { color: string; bg: string; label: string }> = {
  room:     { color: "text-emerald-700", bg: "bg-emerald-500",  label: "Phòng & Bungalow" },
  food:     { color: "text-amber-700",   bg: "bg-amber-400",    label: "Ăn uống" },
  wellness: { color: "text-violet-700",  bg: "bg-violet-500",   label: "Sức khoẻ & Spa" },
  utility:  { color: "text-sky-700",     bg: "bg-sky-500",      label: "Tiện ích" },
  nature:   { color: "text-teal-700",    bg: "bg-teal-500",     label: "Thiên nhiên" },
};

const POIS: POI[] = [
  // Rooms
  { id: "reception",   label: "Lễ tân",             category: "utility",  emoji: "🏛",  desc: "Lễ tân mở cửa 24/7. Check-in, hỗ trợ và mọi yêu cầu của quý khách.",               x: 50, y: 44 },
  { id: "bungalow",    label: "Bungalow View Biển",  category: "room",     emoji: "🏖",  desc: "3 bungalow sát biển, ban công riêng, hồ bơi riêng. Nhìn thẳng ra vịnh.",          x: 72, y: 62, link: "/phong/bungalow-bien" },
  { id: "nha-san",     label: "Nhà Sàn Rừng",        category: "room",     emoji: "🌲",  desc: "3 nhà sàn gỗ giữa rừng trầm, cao 2m, cầu thang gỗ, vòi sen ngoài trời.",         x: 24, y: 28, link: "/phong/nha-san-rung" },
  { id: "villa",       label: "Villa Gia Đình",       category: "room",     emoji: "🏡",  desc: "2 villa rộng 120m², 2 phòng ngủ, hồ bơi riêng, sân vườn và BBQ.",               x: 35, y: 65, link: "/phong/villa-gia-dinh" },
  { id: "eco-pod",     label: "Eco Pod",              category: "room",     emoji: "🛸",  desc: "4 eco pod hình tròn với mái kính nhìn sao, bồn tắm ngoài trời.",                 x: 62, y: 24, link: "/phong/eco-pod" },
  { id: "leu",         label: "Lều Đồng Cỏ",          category: "room",     emoji: "⛺", desc: "5 lều glamping trên đồng cỏ xanh, gần suối và khu lửa trại.",                    x: 20, y: 58, link: "/phong/leu-dong-co" },
  { id: "suite",       label: "Suite Trầm Hương",     category: "room",     emoji: "👑",  desc: "Suite cao cấp nhất resort với butler service, infinity pool và spa riêng.",        x: 80, y: 34, link: "/phong/suite-tram-huong" },
  // Food
  { id: "nha-hang",   label: "Nhà hàng",             category: "food",     emoji: "🍽",  desc: "Nhà hàng chính phục vụ 3 bữa/ngày. Ẩm thực Bình Định và quốc tế.",              x: 50, y: 56 },
  { id: "quan-cafe",   label: "Quán Cà phê",          category: "food",     emoji: "☕", desc: "Cà phê chồn, trà trầm hương và đồ uống tươi. Mở từ 6:00–22:00.",               x: 42, y: 40 },
  { id: "bar-bien",    label: "Bar Bãi Biển",         category: "food",     emoji: "🍹",  desc: "Cocktail tươi, hải sản nướng và sinh tố trái cây. Mở từ 10:00–23:00.",           x: 80, y: 74 },
  // Wellness
  { id: "spa",         label: "Spa Trầm Hương",       category: "wellness", emoji: "💆", desc: "Spa cao cấp với 4 phòng trị liệu, hồ ngâm thảo dược và phòng yoga.",            x: 33, y: 48, link: "/hoat-dong/spa-tram-huong" },
  { id: "yoga",        label: "Sân Yoga",             category: "wellness", emoji: "🧘", desc: "Sân yoga ngoài trời trên bãi cỏ, nhìn về phía mặt trời mọc.",                    x: 58, y: 48, link: "/hoat-dong/yoga-buoi-sang" },
  { id: "ho-boi",      label: "Hồ bơi chính",         category: "wellness", emoji: "🏊", desc: "Hồ bơi vô cực 30m x 12m, nhìn ra biển. Mở từ 6:00–22:00.",                      x: 65, y: 54 },
  // Utility
  { id: "bai-do-xe",   label: "Bãi đỗ xe",            category: "utility",  emoji: "🅿",  desc: "Bãi đỗ xe miễn phí. Sạc xe điện và xe đạp cho thuê.",                          x: 50, y: 18 },
  { id: "y-te",        label: "Trạm Y tế",            category: "utility",  emoji: "⛑",  desc: "Y tá thường trực 24/7. Sơ cứu và hỗ trợ y tế cơ bản.",                         x: 42, y: 50 },
  { id: "wc-1",        label: "WC Khu A",             category: "utility",  emoji: "🚻",  desc: "Nhà vệ sinh công cộng khu rừng. Sạch sẽ, có phòng thay đồ.",                    x: 24, y: 44 },
  { id: "wc-2",        label: "WC Biển",              category: "utility",  emoji: "🚻",  desc: "Nhà vệ sinh và phòng tắm bãi biển. Mở từ 6:00–21:00.",                          x: 75, y: 78 },
  // Nature
  { id: "bai-bien",    label: "Bãi Biển Riêng",       category: "nature",   emoji: "🏖",  desc: "500m bãi biển cát trắng riêng của resort. Tắm biển, lặn và chèo kayak.",         x: 85, y: 62 },
  { id: "rung-tram",   label: "Rừng Trầm Hương",      category: "nature",   emoji: "🌿",  desc: "Khu rừng trầm hương tự nhiên. Điểm khởi đầu các tour trekking.",                x: 15, y: 36, link: "/hoat-dong/trek-rung-tram" },
  { id: "suoi",        label: "Suối Thiên Nhiên",     category: "nature",   emoji: "💧",  desc: "Con suối chảy qua khuôn viên. Địa điểm thiền định và ngắm cảnh.",               x: 28, y: 70, link: "/hoat-dong/thien-dinh-suoi" },
  { id: "lua-trai",    label: "Khu Lửa Trại",         category: "nature",   emoji: "🔥",  desc: "Sân lửa trại mỗi tối 20:00. Sức chứa 30 người.",                               x: 22, y: 72, link: "/hoat-dong/dot-lua-trai" },
];

const ALL_CATEGORIES: Category[] = ["room", "food", "wellness", "utility", "nature"];

// ─── Map zones (decorative SVG background) ───────────────

function MapBackground() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
      {/* Base ground */}
      <rect width="100" height="100" fill="#d1fae5" />

      {/* Beach / sea */}
      <path d="M 60 55 Q 75 60 95 58 L 100 100 L 60 100 Z" fill="#bae6fd" opacity="0.7" />
      <path d="M 70 60 Q 85 65 100 62 L 100 100 L 70 100 Z" fill="#7dd3fc" opacity="0.5" />

      {/* Forest areas */}
      <ellipse cx="18" cy="32" rx="16" ry="20" fill="#6ee7b7" opacity="0.6" />
      <ellipse cx="12" cy="55" rx="14" ry="18" fill="#6ee7b7" opacity="0.5" />
      <ellipse cx="30" cy="20" rx="12" ry="10" fill="#6ee7b7" opacity="0.4" />

      {/* Grassland */}
      <ellipse cx="25" cy="72" rx="12" ry="10" fill="#a7f3d0" opacity="0.6" />
      <ellipse cx="60" cy="36" rx="10" ry="8" fill="#bbf7d0" opacity="0.5" />

      {/* Main path */}
      <path d="M 50 18 L 50 44 L 50 60 L 65 72 L 80 72" stroke="#e5e7eb" strokeWidth="1.5" fill="none" />
      <path d="M 50 44 L 35 48 L 24 44" stroke="#e5e7eb" strokeWidth="1" fill="none" />
      <path d="M 50 44 L 62 48" stroke="#e5e7eb" strokeWidth="1" fill="none" />
      <path d="M 35 48 L 22 58 L 22 72" stroke="#e5e7eb" strokeWidth="1" fill="none" />
      <path d="M 50 60 L 35 65 L 22 72" stroke="#e5e7eb" strokeWidth="1" fill="none" />

      {/* Stream */}
      <path d="M 15 20 Q 22 35 26 50 Q 28 60 26 72" stroke="#67e8f9" strokeWidth="1" fill="none" opacity="0.8" strokeDasharray="2 1" />

      {/* Pool */}
      <ellipse cx="65" cy="54" rx="5" ry="3" fill="#38bdf8" opacity="0.8" />

      {/* Buildings - reception */}
      <rect x="46" y="41" width="8" height="6" rx="1" fill="#f0fdf4" stroke="#6ee7b7" strokeWidth="0.5" />

      {/* Buildings - restaurant */}
      <rect x="46" y="53" width="8" height="5" rx="1" fill="#fefce8" stroke="#fcd34d" strokeWidth="0.5" />

      {/* Scale / north indicator */}
      <text x="5" y="95" fontSize="2.5" fill="#6b7280" fontFamily="sans-serif">← Rừng trầm</text>
      <text x="68" y="95" fontSize="2.5" fill="#6b7280" fontFamily="sans-serif">Biển Đông →</text>

      {/* Compass */}
      <text x="92" y="8" fontSize="4" fill="#6b7280" fontFamily="sans-serif">N</text>
      <line x1="94" y1="9" x2="94" y2="14" stroke="#6b7280" strokeWidth="0.5" />
      <polygon points="94,9 92.5,13 94,12 95.5,13" fill="#6b7280" />
    </svg>
  );
}

// ─── Marker ──────────────────────────────────────────────

function Marker({
  poi,
  active,
  onClick,
}: {
  poi: POI;
  active: boolean;
  onClick: () => void;
}) {
  const meta = CATEGORY_META[poi.category];
  return (
    <button
      onClick={onClick}
      className="absolute -translate-x-1/2 -translate-y-1/2 group"
      style={{ left: `${poi.x}%`, top: `${poi.y}%` }}
      aria-label={poi.label}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md border-2 transition-all duration-200 ${
          active
            ? `${meta.bg} border-white scale-125 shadow-lg`
            : `${meta.bg} border-white/70 hover:scale-110 hover:shadow-lg opacity-90`
        }`}
      >
        {poi.emoji}
      </div>
      {/* Label on hover */}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-slate-900/90 text-white text-[10px] font-medium px-2 py-1 rounded-md">
          {poi.label}
        </div>
      </div>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────

export function ResortMap() {
  const [active, setActive] = useState<POI | null>(null);
  const [filter, setFilter] = useState<Category | "all">("all");

  const visible = filter === "all" ? POIS : POIS.filter((p) => p.category === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setFilter("all")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
            filter === "all"
              ? "bg-slate-800 text-white border-slate-800"
              : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
          }`}
        >
          ✨ Tất cả
        </button>
        {ALL_CATEGORIES.map((cat) => {
          const meta = CATEGORY_META[cat];
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                filter === cat
                  ? `${meta.bg} text-white border-transparent`
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
              }`}
            >
              {meta.label}
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-5 items-start">
        {/* Map */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div
            className="relative w-full"
            style={{ paddingBottom: "70%" }}
            onClick={() => setActive(null)}
          >
            <MapBackground />
            {visible.map((poi) => (
              <Marker
                key={poi.id}
                poi={poi}
                active={active?.id === poi.id}
                onClick={() => {
                  setActive(active?.id === poi.id ? null : poi);
                }}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="px-5 py-3 border-t border-slate-100 flex flex-wrap gap-4">
            {ALL_CATEGORIES.map((cat) => {
              const meta = CATEGORY_META[cat];
              return (
                <span key={cat} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className={`w-3 h-3 rounded-full ${meta.bg}`} />
                  {meta.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* Info panel */}
        <div>
          {active ? (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sticky top-[88px]">
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${CATEGORY_META[active.category].bg} bg-opacity-15`}>
                  {active.emoji}
                </div>
                <div>
                  <span className={`text-[11px] font-semibold uppercase tracking-wide ${CATEGORY_META[active.category].color}`}>
                    {CATEGORY_META[active.category].label}
                  </span>
                  <h2 className="font-serif text-xl text-slate-900 mt-0.5">{active.label}</h2>
                </div>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-5">{active.desc}</p>
              {active.link && (
                <Link
                  href={active.link}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Xem chi tiết
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              )}
              <button
                onClick={() => setActive(null)}
                className="mt-4 text-xs text-slate-400 hover:text-slate-600"
              >
                Đóng
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sticky top-[88px]">
              <p className="text-slate-400 text-sm text-center py-6">
                Nhấn vào bất kỳ điểm nào trên bản đồ để xem thông tin.
              </p>
              <div className="space-y-2 mt-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Danh sách nhanh
                </p>
                {visible.slice(0, 8).map((poi) => (
                  <button
                    key={poi.id}
                    onClick={() => setActive(poi)}
                    className="w-full flex items-center gap-3 text-left px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-xl">{poi.emoji}</span>
                    <span className="text-sm text-slate-700">{poi.label}</span>
                  </button>
                ))}
                {visible.length > 8 && (
                  <p className="text-xs text-slate-400 text-center pt-1">
                    +{visible.length - 8} điểm khác trên bản đồ
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
