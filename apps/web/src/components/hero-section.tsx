"use client";

import { useEffect, useRef } from "react";

export function HeroSection() {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (!bgRef.current) return;
      const y = window.scrollY;
      bgRef.current.style.transform = `translate3d(0, ${y * 0.4}px, 0)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Parallax background */}
      <div ref={bgRef} className="absolute inset-0 will-change-transform">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, #022c22 0%, #064e3b 25%, #047857 55%, #065f46 75%, #0f172a 100%)",
          }}
        />
        {/* Soft glows */}
        <div
          className="absolute top-1/3 right-1/3 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(16,185,129,0.25) 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(163,230,53,0.12) 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute top-1/2 right-1/4 w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 65%)",
          }}
        />
      </div>

      {/* Forest silhouette */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg
          viewBox="0 0 1440 240"
          preserveAspectRatio="none"
          className="w-full block"
          style={{ height: "clamp(120px, 20vw, 240px)" }}
        >
          <path
            d="M0,240 L0,180 Q80,80 160,140 Q240,200 320,120 Q400,40 480,130 Q560,210 640,110 Q720,20 800,120 Q880,210 960,130 Q1040,50 1120,140 Q1200,220 1280,150 Q1360,90 1440,160 L1440,240 Z"
            fill="rgba(2, 44, 34, 0.7)"
          />
          <path
            d="M0,240 L0,200 Q60,140 120,180 Q180,220 240,170 Q300,120 360,180 Q420,230 480,190 Q540,150 600,190 Q660,225 720,190 Q780,155 840,195 Q900,230 960,195 Q1020,160 1080,200 Q1140,235 1200,200 Q1260,165 1320,200 Q1380,230 1440,210 L1440,240 Z"
            fill="rgba(2, 44, 34, 0.9)"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto pt-[72px]">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-xs font-medium tracking-[0.15em] uppercase px-4 py-2 rounded-full mb-10">
          <span
            className="w-1.5 h-1.5 rounded-full bg-emerald-400"
            style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
          />
          Bình Định · Việt Nam
        </div>

        {/* Headline */}
        <h1 className="font-serif font-semibold text-white leading-[1.05] mb-6">
          <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl">
            Trầm Hương
          </span>
          <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-emerald-300 mt-1">
            Eco-Resort
          </span>
        </h1>

        {/* Tagline */}
        <p className="text-white/65 text-base sm:text-lg md:text-xl max-w-xl mx-auto mb-12 leading-relaxed">
          Hương của núi rừng, hồn của Bình Định.
          <br className="hidden sm:block" />
          Nơi thiên nhiên thuần khiết gặp gỡ sự thư thái trọn vẹn.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/dat-phong"
            className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full transition-all duration-200 hover:shadow-[0_8px_30px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 active:translate-y-0 text-sm sm:text-base"
          >
            Đặt phòng ngay
          </a>
          <a
            href="#gioi-thieu"
            className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-medium rounded-full transition-all duration-200 border border-white/25 text-sm sm:text-base"
          >
            Khám phá
          </a>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40 select-none">
          <span className="text-[10px] tracking-[0.2em] uppercase">Cuộn xuống</span>
          <svg
            className="w-5 h-5 animate-bounce"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
