const EXPLORE_LINKS = [
  { href: "/gioi-thieu", label: "Giới thiệu" },
  { href: "/phong", label: "Phòng & bungalow" },
  { href: "/hoat-dong", label: "Hoạt động" },
  { href: "/ban-do", label: "Bản đồ resort" },
  { href: "/dat-phong", label: "Đặt phòng" },
  { href: "/dat-phong/tra-cuu", label: "Tra cứu đặt phòng" },
];

function LogoMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-5 h-5 text-white"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 2C8 2 4.5 5.5 4.5 9.5c0 5.25 7.5 12.5 7.5 12.5s7.5-7.25 7.5-12.5C19.5 5.5 16 2 12 2z"
      />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer id="lien-he" className="bg-emerald-950 text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-14">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                <LogoMark />
              </div>
              <div className="leading-tight">
                <p className="font-serif text-[17px] font-semibold">
                  Trầm Hương
                </p>
                <p className="text-[10px] text-emerald-400 tracking-[0.2em] uppercase">
                  Eco-Resort
                </p>
              </div>
            </div>
            <p className="text-white/55 text-sm leading-relaxed max-w-xs mb-7">
              Hương của núi rừng, hồn của Bình Định. Khu nghỉ dưỡng sinh thái
              cao cấp giữa thiên nhiên thuần khiết.
            </p>
            <div className="flex items-center gap-3">
              <a href="https://facebook.com/tramhuongresort" target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-emerald-600 flex items-center justify-center transition-colors duration-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                </svg>
              </a>
              <a href="https://instagram.com/tramhuongresort" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-emerald-600 flex items-center justify-center transition-colors duration-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
                </svg>
              </a>
              <a href="https://zalo.me/tramhuongresort" target="_blank" rel="noopener noreferrer" aria-label="Zalo"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-emerald-600 flex items-center justify-center transition-colors duration-200">
                <span className="text-[11px] font-bold">Zalo</span>
              </a>
            </div>
          </div>

          {/* Explore */}
          <div>
            <p className="text-white/35 text-[11px] font-semibold tracking-[0.2em] uppercase mb-5">
              Khám phá
            </p>
            <ul className="space-y-3">
              {EXPLORE_LINKS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-white/55 hover:text-white text-sm transition-colors duration-150"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-white/35 text-[11px] font-semibold tracking-[0.2em] uppercase mb-5">
              Liên hệ
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-white/55">
                <svg
                  className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                  />
                </svg>
                <span>Xã Cát Khánh, Phù Cát, Bình Định</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/55">
                <svg
                  className="w-4 h-4 shrink-0 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                  />
                </svg>
                <a href="tel:0932183605" className="hover:text-white transition-colors">0932 183 605</a>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/55">
                <svg
                  className="w-4 h-4 shrink-0 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
                <span>hello@tramhuong-resort.vn</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/35 text-xs">
            © 2026 Trầm Hương Eco-Resort. Bảo lưu mọi quyền.
          </p>
          <div className="flex items-center gap-6 text-xs text-white/35">
            <a href="/chinh-sach-bao-mat" className="hover:text-white/60 transition-colors">
              Chính sách bảo mật
            </a>
            <a href="/dieu-khoan-dich-vu" className="hover:text-white/60 transition-colors">
              Điều khoản dịch vụ
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
