"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

type Photo = {
  src: string;
  alt: string;
  category: string;
  span?: "wide" | "tall" | "normal";
};

const PHOTOS: Photo[] = [
  // Phòng & Bungalow
  { src: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=85", alt: "Bungalow view biển buổi sáng", category: "phong", span: "wide" },
  { src: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80", alt: "Phòng Suite Trầm Hương", category: "phong" },
  { src: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80", alt: "Villa Gia Đình ban công", category: "phong", span: "tall" },
  { src: "https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=800&q=80", alt: "Eco Pod giữa rừng xanh", category: "phong" },
  { src: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80", alt: "Nhà Sàn Rừng nội thất", category: "phong" },
  { src: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80", alt: "Lều Đồng Cỏ view đồi núi", category: "phong", span: "wide" },
  { src: "https://images.unsplash.com/photo-1496080174650-637e3f22fa03?w=800&q=80", alt: "Hồ bơi vô cực", category: "phong" },
  { src: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80", alt: "Phòng tắm đá tự nhiên", category: "phong" },

  // Thiên nhiên & Cảnh quan
  { src: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&q=85", alt: "Bãi biển Bình Định trong xanh", category: "thiennhien", span: "wide" },
  { src: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80", alt: "Rừng trầm hương nguyên sinh", category: "thiennhien", span: "tall" },
  { src: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=80", alt: "Hoàng hôn trên đồi cỏ", category: "thiennhien" },
  { src: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&q=80", alt: "Ánh nắng xuyên rừng", category: "thiennhien" },
  { src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=85", alt: "Bãi biển cát trắng", category: "thiennhien", span: "wide" },
  { src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80", alt: "Con đường trong rừng xanh", category: "thiennhien" },

  // Hoạt động
  { src: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&q=85", alt: "Lặn snorkeling san hô", category: "hoatdong", span: "wide" },
  { src: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80", alt: "Kayak trên biển buổi sáng", category: "hoatdong" },
  { src: "https://images.unsplash.com/photo-1472722266948-a898fb19c24f?w=800&q=80", alt: "Yoga bình minh trên bãi biển", category: "hoatdong", span: "tall" },
  { src: "https://images.unsplash.com/photo-1468581264429-2548ef9eb732?w=800&q=80", alt: "Đánh cá đêm cùng ngư dân", category: "hoatdong" },
  { src: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&q=80", alt: "Trekking rừng trầm hương", category: "hoatdong" },
  { src: "https://images.unsplash.com/photo-1515861461225-1488dfdaf0a8?w=800&q=80", alt: "Lửa trại đêm dưới sao", category: "hoatdong", span: "wide" },

  // Ẩm thực
  { src: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=85", alt: "Hải sản tươi Bình Định", category: "amthuc", span: "wide" },
  { src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80", alt: "Bữa sáng nhìn ra biển", category: "amthuc" },
  { src: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80", alt: "Bánh xèo hải sản địa phương", category: "amthuc", span: "tall" },
  { src: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80", alt: "Cocktail nhiệt đới pool bar", category: "amthuc" },
  { src: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80", alt: "Bàn tiệc nướng BBQ bờ biển", category: "amthuc" },

  // Spa & Thư giãn
  { src: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&q=85", alt: "Massage thảo mộc trầm hương", category: "spa", span: "wide" },
  { src: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80", alt: "Phòng spa gỗ tự nhiên", category: "spa" },
  { src: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80", alt: "Bể tắm ngoài trời", category: "spa", span: "tall" },
  { src: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&q=80", alt: "Sauna đá muối Himalaya", category: "spa" },
];

const CATEGORIES = [
  { key: "all", label: "Tất cả" },
  { key: "phong", label: "Phòng & Bungalow" },
  { key: "thiennhien", label: "Thiên nhiên" },
  { key: "hoatdong", label: "Hoạt động" },
  { key: "amthuc", label: "Ẩm thực" },
  { key: "spa", label: "Spa & Thư giãn" },
];

export default function GalleryPage() {
  const [active, setActive] = useState("all");
  const [lightbox, setLightbox] = useState<Photo | null>(null);

  const filtered = active === "all" ? PHOTOS : PHOTOS.filter(p => p.category === active);

  const closeLightbox = useCallback(() => setLightbox(null), []);

  // Keyboard navigation
  useEffect(() => {
    if (!lightbox) return;
    const allPhotos = active === "all" ? PHOTOS : PHOTOS.filter(p => p.category === active);
    const idx = allPhotos.findIndex(p => p.src === lightbox.src);
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight" && idx < allPhotos.length - 1) setLightbox(allPhotos[idx + 1]!);
      if (e.key === "ArrowLeft" && idx > 0) setLightbox(allPhotos[idx - 1]!);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, active, closeLightbox]);

  return (
    <>
      <SiteNav />

      {/* Hero */}
      <section className="pt-[72px] bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 text-center">
          <p className="text-emerald-400 text-xs font-semibold tracking-[0.2em] uppercase mb-4">
            Thư viện ảnh
          </p>
          <h1 className="font-serif text-4xl lg:text-5xl text-white mb-4">
            Khám phá Trầm Hương
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Từng góc nhìn, từng khoảnh khắc — hành trình nghỉ dưỡng của bạn bắt đầu từ đây.
          </p>
        </div>
      </section>

      <main className="bg-slate-50 min-h-screen py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActive(cat.key)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                  active === cat.key
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-emerald-400"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Masonry grid */}
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {filtered.map((photo, i) => (
              <div
                key={i}
                className="break-inside-avoid cursor-pointer group relative overflow-hidden rounded-2xl bg-slate-200"
                onClick={() => setLightbox(photo)}
              >
                <div className={`relative w-full ${
                  photo.span === "wide" ? "aspect-[4/3]" :
                  photo.span === "tall" ? "aspect-[3/4]" :
                  "aspect-square"
                }`}>
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-end p-4">
                    <p className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                      {photo.alt}
                    </p>
                  </div>
                  {/* Zoom icon */}
                  <div className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Count */}
          <p className="text-center text-slate-400 text-sm mt-8">
            {filtered.length} ảnh {active !== "all" && `trong danh mục "${CATEGORIES.find(c => c.key === active)?.label}"`}
          </p>

          {/* CTA */}
          <div className="text-center mt-12">
            <Link
              href="/dat-phong"
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full text-sm transition-colors"
            >
              Đặt phòng ngay
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </main>

      {/* Lightbox */}
      {lightbox && (() => {
        const allPhotos = active === "all" ? PHOTOS : PHOTOS.filter(p => p.category === active);
        const idx = allPhotos.findIndex(p => p.src === lightbox.src);
        return (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center text-xl transition-colors"
            aria-label="Đóng"
          >
            ✕
          </button>

          {/* Prev */}
          {idx > 0 && (
            <button
              onClick={e => { e.stopPropagation(); setLightbox(allPhotos[idx - 1]!); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
              aria-label="Ảnh trước"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}

          {/* Next */}
          {idx < allPhotos.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); setLightbox(allPhotos[idx + 1]!); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
              aria-label="Ảnh tiếp"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}

          <div
            className="relative max-w-5xl w-full max-h-[85vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative w-full aspect-[4/3]">
              <Image
                src={lightbox.src.replace("w=800", "w=1600").replace("w=1200", "w=1600")}
                alt={lightbox.alt}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
            <p className="text-white/70 text-sm text-center mt-3">
              {lightbox.alt}
              <span className="text-white/40 ml-2 text-xs">{idx + 1} / {allPhotos.length}</span>
            </p>
          </div>
        </div>
        );
      })()}

      <SiteFooter />
    </>
  );
}
