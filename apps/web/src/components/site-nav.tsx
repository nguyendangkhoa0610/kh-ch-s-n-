"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLang } from "@/components/language-provider";
import { useCustomerAuth } from "@/lib/customer-auth";

const NAV_KEYS = [
  { href: "/gioi-thieu", key: "nav.about" },
  { href: "/phong", key: "nav.rooms" },
  { href: "/hoat-dong", key: "nav.activities" },
  { href: "/thu-vien", key: "nav.gallery" },
  { href: "/ban-do", key: "nav.map" },
  { href: "/lap-lich", key: "nav.aiplan" },
  { href: "/lien-he", key: "nav.contact" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { lang, setLang, t } = useLang();
  const { user, logout } = useCustomerAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!accountOpen) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-account-menu]")) setAccountOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [accountOpen]);

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

          {/* Account */}
          {user ? (
            <div className="relative" data-account-menu>
              <button
                onClick={() => setAccountOpen(v => !v)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-colors text-sm font-semibold ${
                  scrolled ? "border-slate-200 text-slate-700 hover:border-emerald-400" : "border-white/30 text-white hover:border-white"
                }`}
              >
                <span className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {user.name[0].toUpperCase()}
                </span>
                <span className="hidden sm:block max-w-[100px] truncate">{user.name.split(" ").at(-1)}</span>
                <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                  <Link href="/tai-khoan" onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    Tài khoản của tôi
                  </Link>
                  <Link href="/tai-khoan/dat-phong-cua-toi" onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    Đặt phòng của tôi
                  </Link>
                  <hr className="my-1 border-slate-100" />
                  <button onClick={() => { logout(); setAccountOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/tai-khoan/dang-nhap"
              className={`text-sm font-semibold px-4 py-2 rounded-full border transition-colors ${
                scrolled ? "border-slate-200 text-slate-700 hover:border-emerald-400 hover:text-emerald-600" : "border-white/40 text-white/90 hover:border-white hover:text-white"
              }`}>
              Đăng nhập
            </Link>
          )}

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
        <div className="md:hidden bg-white border-t border-slate-100 px-6 py-5 flex flex-col gap-1 shadow-lg">
          {NAV_KEYS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-slate-700 text-sm font-medium py-2.5 border-b border-slate-50"
              onClick={() => setMenuOpen(false)}
            >
              {t(item.key)}
            </a>
          ))}

          {/* Account section */}
          <div className="mt-3 pt-3 border-t border-slate-100">
            {user ? (
              <div className="space-y-1">
                <div className="flex items-center gap-3 py-2 px-1">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {user.name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>
                <Link href="/tai-khoan" onClick={() => setMenuOpen(false)}
                  className="block py-2 px-1 text-sm text-slate-600 hover:text-emerald-600">
                  Tài khoản của tôi
                </Link>
                <Link href="/tai-khoan/dat-phong-cua-toi" onClick={() => setMenuOpen(false)}
                  className="block py-2 px-1 text-sm text-slate-600 hover:text-emerald-600">
                  Đặt phòng của tôi
                </Link>
                <button onClick={() => { logout(); setMenuOpen(false); }}
                  className="block py-2 px-1 text-sm text-red-500 w-full text-left">
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link href="/tai-khoan/dang-nhap" onClick={() => setMenuOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl text-center hover:border-emerald-400">
                  Đăng nhập
                </Link>
                <Link href="/tai-khoan/dang-ky" onClick={() => setMenuOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl text-center hover:bg-slate-200">
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-3">
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
