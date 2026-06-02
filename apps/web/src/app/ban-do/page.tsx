import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ResortMap } from "@/components/resort-map";

export const metadata: Metadata = {
  title: "Bản đồ khu resort — Trầm Hương Eco-Resort",
  description:
    "Khám phá bản đồ khuôn viên Trầm Hương Eco-Resort — vị trí các phòng, nhà hàng, hồ bơi, spa và tiện ích.",
};

// Thay GOOGLE_MAPS_EMBED_URL bằng link embed thật của bạn:
// 1. Vào Google Maps → tìm resort → Chia sẻ → Nhúng bản đồ → copy src="..."
const GOOGLE_MAPS_EMBED_URL =
  "https://maps.google.com/maps?q=13.7829,109.2196&z=15&output=embed";

export default function BanDoPage() {
  return (
    <>
      <SiteNav />

      <section className="pt-[72px] bg-emerald-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
          <p className="text-emerald-400 text-xs font-semibold tracking-[0.2em] uppercase mb-4">
            Khám phá
          </p>
          <h1 className="font-serif text-4xl lg:text-5xl text-white mb-4">
            Bản đồ khu resort
          </h1>
          <p className="text-white/60 text-lg max-w-2xl">
            Nhấn vào bất kỳ vị trí nào để xem thông tin. Khuôn viên rộng 12
            hecta — đủ để lạc, nhưng không bao giờ thực sự lạc.
          </p>
        </div>
      </section>

      {/* Google Maps — vị trí thực tế */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
          <h2 className="font-serif text-2xl text-slate-900 mb-2">Vị trí resort</h2>
          <p className="text-slate-500 text-sm mb-5">
            Trầm Hương Eco-Resort · Bình Định, Việt Nam
          </p>
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: 400 }}>
            <iframe
              src={GOOGLE_MAPS_EMBED_URL}
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Vị trí Trầm Hương Eco-Resort"
            />
          </div>
          <div className="mt-4 flex items-center gap-4">
            <a
              href={`https://maps.google.com/?q=13.7829,109.2196`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              Mở trong Google Maps
            </a>
            <span className="text-slate-300">·</span>
            <span className="text-sm text-slate-400">Cách sân bay Phù Cát 45 phút</span>
          </div>
        </div>
      </section>

      {/* Sơ đồ khuôn viên resort */}
      <main className="bg-slate-100 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-10 pb-4">
          <h2 className="font-serif text-2xl text-slate-900 mb-1">Sơ đồ khuôn viên</h2>
          <p className="text-slate-500 text-sm mb-6">Nhấn vào từng điểm để xem chi tiết</p>
        </div>
        <ResortMap />
      </main>

      <SiteFooter />
    </>
  );
}
