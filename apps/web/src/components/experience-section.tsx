const FEATURES = [
  {
    id: "nature",
    label: "Thiên nhiên nguyên sơ",
    headline: "12 hecta rừng trầm\ngiữa lòng Bình Định",
    body: "Khuôn viên rộng lớn với suối chảy, rừng trầm hương và vườn thảo mộc. Đi bộ 5 phút là tách hoàn toàn khỏi thế giới bên ngoài.",
    accent: "bg-emerald-600",
    bg: "from-emerald-950 to-emerald-900",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    id: "food",
    label: "Ẩm thực địa phương",
    headline: "100% nguyên liệu\ntừ làng chài Bình Định",
    body: "Hải sản tươi sống mỗi sáng, rau sạch từ vườn resort, gạo lứt hữu cơ. Bếp mở để khách tham quan và học nấu cùng đầu bếp.",
    accent: "bg-amber-500",
    bg: "from-amber-950 to-orange-900",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 21H9m1.5-3h3M6 13.125v3.75c0 .621.504 1.125 1.125 1.125H16.875c.621 0 1.125-.504 1.125-1.125v-3.75" />
      </svg>
    ),
  },
  {
    id: "wellness",
    label: "Tái tạo năng lượng",
    headline: "Spa trầm hương &\nyoga lúc bình minh",
    body: "Liệu pháp spa độc quyền với tinh dầu trầm hương Bình Định, yoga trên bãi cỏ sương sớm và thiền định ven suối.",
    accent: "bg-violet-500",
    bg: "from-violet-950 to-purple-900",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
  },
];

export function ExperienceSection() {
  return (
    <section className="py-24 lg:py-32 bg-slate-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="mb-14">
          <p className="text-emerald-400 text-xs font-semibold tracking-[0.2em] uppercase mb-4">
            Điều chúng tôi tự hào
          </p>
          <h2 className="font-serif text-4xl lg:text-5xl text-white leading-snug max-w-2xl">
            Ba điều làm nên{" "}
            <span className="text-emerald-400">Trầm Hương</span>
          </h2>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.id}
              className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${f.bg} p-8 flex flex-col justify-between min-h-[360px] group hover:scale-[1.015] transition-transform duration-300`}
            >
              {/* Glow */}
              <div
                className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20 blur-3xl"
                style={{ background: "white" }}
              />

              {/* Top row */}
              <div>
                <div
                  className={`w-14 h-14 rounded-2xl ${f.accent} bg-opacity-90 flex items-center justify-center text-white mb-6`}
                >
                  {f.icon}
                </div>
                <p className="text-white/50 text-xs font-semibold tracking-[0.15em] uppercase mb-3">
                  {f.label}
                </p>
                <h3 className="font-serif text-2xl font-semibold text-white leading-snug whitespace-pre-line mb-4">
                  {f.headline}
                </h3>
              </div>

              {/* Body */}
              <p className="text-white/60 text-sm leading-relaxed">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
