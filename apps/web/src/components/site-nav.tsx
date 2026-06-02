"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLang } from "@/components/language-provider";

const NAV_KEYS = [
  { href: "/gioi-thieu", key: "nav.about" },
  { href: "/phong", key: "nav.rooms" },
  { href: "/hoat-dong", key: "nav.activities" },
  { href: "/thu-vien", key: "nav.gallery" },
  { href: "/ban-do", key: "nav.map" },
  { href: "/lap-lich", key: "nav.aiplan" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { lang, setLang, t } = useLang();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-[72px]">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 2C8 2 4.5 5.5 4.5 9.5c0 5.25 7.5 12.5 7.5 12.5s7.5-7.25 7.5-12.5C19.5 5.5 16 2 12 2z"
              />
              <circle cx="12" cy="9.5" r="2.5" />
            </svg>
          </div>
          <div className="leading-tight">
            <span
              className={`font-serif text-[17px] font-semibold block transition-colors ${
                scrolled ? "text-slate-900" : "text-white"
              }`}
            >
              Trầm Hương
            </span>
            <span
              className={`text-[10px] tracking-[0.2em] uppercase font-medium transition-colors ${
                scrolled ? "text-emerald-600" : "text-emerald-300"
              }`}
            >
              Eco-Resort
            </span>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_KEYS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-emerald-500 ${
                scrolled ? "text-slate-700" : "text-white/90"
              }`}
            >
              {t(item.key)}
            </a>
          ))}
        </div>

        {/* Right side: lang toggle + CTA */}
        <div className="hidden md:flex items-center gap-3">
          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === "vi" ? "en" : "vi")}
            aria-label="Switch language"
            className={`text-xs font-semibold tracking-wider px-2.5 py-1 rounded-full border transition-colors ${
              scrolled
                ? "border-slate-300 text-slate-600 hover:border-emerald-500 hover:text-emerald-600"
                : "border-white/40 text-white/80 hover:border-white hover:text-white"
            }`}
          >
            {lang === "vi" ? "EN" : "VI"}
          </button>

          <a
            href="/dat-phong"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-full transition-colors"
          >
            {t("nav.book")}
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className={`md:hidden p-2 rounded-lg transition-colors ${
            scrolled ? "text-slate-700" : "text-white"
          }`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={menuOpen}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-6 py-5 flex flex-col gap-4 shadow-lg">
          {NAV_KEYS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-slate-700 text-sm font-medium py-1"
              onClick={() => setMenuOpen(false)}
            >
              {t(item.key)}
            </a>
          ))}
          <div className="flex items-center gap-3 mt-2">
            <a
              href="/dat-phong"
              className="flex-1 px-5 py-3 bg-emerald-600 text-white text-sm font-semibold rounded-full text-center"
              onClick={() => setMenuOpen(false)}
            >
              {t("nav.book")}
            </a>
            <button
              onClick={() => setLang(lang === "vi" ? "en" : "vi")}
              aria-label="Switch language"
              className="px-3 py-3 border border-slate-300 rounded-full text-xs font-semibold text-slate-600"
            >
              {lang === "vi" ? "EN" : "VI"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
