import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ACTIVITIES, CATEGORY_META } from "@/lib/activity-data";
import { formatPrice } from "@tram-huong/shared";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return ACTIVITIES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const act = ACTIVITIES.find((a) => a.slug === slug);
  if (!act) return {};
  return {
    title: `${act.name} — Trầm Hương Eco-Resort`,
    description: act.description,
  };
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  );
}

function formatDuration(min: number) {
  if (min < 60) return `${min} phút`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${m}` : `${h} giờ`;
}

export default async function ActivityDetailPage({ params }: Props) {
  const { slug } = await params;
  const act = ACTIVITIES.find((a) => a.slug === slug);
  if (!act) notFound();

  const cat = CATEGORY_META[act.category];
  const others = ACTIVITIES.filter(
    (a) => a.category === act.category && a.slug !== slug
  ).slice(0, 3);

  return (
    <>
      <SiteNav />

      {/* Hero */}
      <section className="pt-[72px] relative overflow-hidden bg-slate-900" style={{ minHeight: 380 }}>
        <Image src={act.image} alt={act.name} fill priority sizes="100vw" className="object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-28">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-white/50 text-sm mb-8">
            <Link href="/" className="hover:text-white transition-colors">Trang chủ</Link>
            <span>/</span>
            <Link href="/hoat-dong" className="hover:text-white transition-colors">Hoạt động</Link>
            <span>/</span>
            <span className="text-white/80">{act.name}</span>
          </nav>

          {/* Category badge */}
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border mb-5 ${cat.bg} ${cat.color}`}>
            {cat.emoji} {cat.label}
          </span>

          <div className="flex items-start gap-6">
            <div className="text-7xl select-none hidden sm:block">{act.emoji}</div>
            <div>
              <h1 className="font-serif text-4xl sm:text-5xl text-white font-semibold mb-3 leading-tight">
                {act.name}
              </h1>
              <p className="text-white/70 text-xl mb-8">{act.tagline}</p>

              {/* Quick stats */}
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: "⏱", text: formatDuration(act.duration) },
                  { icon: "👥", text: `Tối đa ${act.maxSlots} người` },
                  {
                    icon: "💰",
                    text: act.price === 0 ? "Miễn phí" : formatPrice(act.price) + "/người",
                  },
                ].map((s) => (
                  <span
                    key={s.text}
                    className="flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-full border border-white/20"
                  >
                    <span>{s.icon}</span>
                    {s.text}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="bg-amber-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid lg:grid-cols-[1fr_360px] gap-12">

            {/* Left */}
            <div className="space-y-10">
              {/* Description */}
              <div>
                <h2 className="font-serif text-2xl text-slate-900 mb-4">Giới thiệu</h2>
                <p className="text-slate-600 text-[17px] leading-relaxed">{act.description}</p>
              </div>

              {/* Included */}
              <div>
                <h2 className="font-serif text-2xl text-slate-900 mb-5">Bao gồm</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {act.included.map((item) => (
                    <div key={item} className="flex items-start gap-3 text-slate-700 text-sm">
                      <CheckIcon />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {act.notes.length > 0 && (
                <div>
                  <h2 className="font-serif text-2xl text-slate-900 mb-5">Lưu ý</h2>
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
                    {act.notes.map((note) => (
                      <div key={note} className="flex items-start gap-3 text-slate-600 text-sm">
                        <InfoIcon />
                        {note}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other activities in same category */}
              {others.length > 0 && (
                <div>
                  <h2 className="font-serif text-2xl text-slate-900 mb-5">
                    Hoạt động {cat.label.toLowerCase()} khác
                  </h2>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {others.map((o) => (
                      <Link
                        key={o.slug}
                        href={`/hoat-dong/${o.slug}`}
                        className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                      >
                        <div className="relative h-24 overflow-hidden">
                          <Image src={o.image} alt={o.name} fill sizes="200px" className="object-cover" />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-3xl">{o.emoji}</div>
                        </div>
                        <div className="p-4">
                          <p className="font-semibold text-slate-900 text-sm mb-1">{o.name}</p>
                          <p className={`text-xs font-semibold ${o.price === 0 ? "text-emerald-600" : "text-slate-500"}`}>
                            {o.price === 0 ? "Miễn phí" : formatPrice(o.price) + "/người"}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: booking card */}
            <div>
              <div className="sticky top-[88px] space-y-4">
                <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.10)] border border-slate-100 overflow-hidden">
                  {/* Price header */}
                  <div className="relative px-7 py-6 bg-emerald-800 overflow-hidden">
                    <Image src={act.image} alt={act.name} fill sizes="400px" className="object-cover opacity-30" />
                    <p className="text-white/60 text-sm mb-1">Giá mỗi người</p>
                    <p className="text-white font-bold text-3xl font-serif">
                      {act.price === 0 ? "Miễn phí" : formatPrice(act.price)}
                    </p>
                    {act.price > 0 && (
                      <p className="text-white/60 text-sm">bao gồm thiết bị & hướng dẫn</p>
                    )}
                  </div>

                  {/* Booking form */}
                  <div className="p-7 space-y-5">
                    {/* Schedule picker */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                        Chọn buổi
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {act.schedules.map((time) => (
                          <button
                            key={time}
                            className="border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-700 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Date */}
                    <label className="block">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                        Ngày
                      </span>
                      <input
                        type="date"
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                      />
                    </label>

                    {/* Guests */}
                    <label className="block">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                        Số người
                      </span>
                      <select className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 appearance-none">
                        {Array.from({ length: Math.min(act.maxSlots, 8) }, (_, i) => i + 1).map((n) => (
                          <option key={n}>{n} người</option>
                        ))}
                      </select>
                    </label>

                    <button className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors text-sm">
                      Đặt lịch ngay
                    </button>

                    <p className="text-center text-xs text-slate-400">
                      Hủy miễn phí trước 24h · Thanh toán tại resort
                    </p>
                  </div>
                </div>

                {/* Contact */}
                <p className="text-center text-sm text-slate-500">
                  Cần tư vấn?{" "}
                  <a href="tel:0256000000" className="text-emerald-600 font-semibold hover:underline">
                    Gọi ngay
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
