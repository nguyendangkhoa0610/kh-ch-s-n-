import Link from "next/link";
import { ACTIVITIES, CATEGORY_META } from "@/lib/activity-data";
import { formatPrice } from "@tram-huong/shared";

const FEATURED_SLUGS = [
  "sup-kayak",
  "dot-lua-trai",
  "yoga-buoi-sang",
  "lam-banh-xeo",
  "trek-rung-tram",
  "spa-tram-huong",
];

const FEATURED = ACTIVITIES.filter((a) => FEATURED_SLUGS.includes(a.slug));

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

export function ActivitiesSection() {
  return (
    <section id="hoat-dong" className="py-24 lg:py-32 bg-amber-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
          <div>
            <p className="text-emerald-600 text-xs font-semibold tracking-[0.2em] uppercase mb-4">
              Trải nghiệm
            </p>
            <h2 className="font-serif text-4xl lg:text-5xl text-slate-900">
              Hoạt động tại resort
            </h2>
          </div>
          <Link
            href="/hoat-dong"
            className="inline-flex items-center gap-2 text-emerald-600 font-semibold text-sm hover:gap-3 transition-all duration-200 group shrink-0"
          >
            Xem tất cả {ACTIVITIES.length} hoạt động
            <svg
              className="w-4 h-4 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURED.map((act) => {
            const cat = CATEGORY_META[act.category];
            return (
              <Link
                key={act.slug}
                href={`/hoat-dong/${act.slug}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-slate-100 flex flex-col transition-all duration-200 hover:-translate-y-1"
              >
                {/* Thumbnail */}
                <div
                  className={`h-32 bg-gradient-to-br ${act.gradient} flex items-center justify-center text-5xl select-none relative`}
                >
                  {act.emoji}
                  <span
                    className={`absolute top-3 left-3 flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${cat.bg} ${cat.color}`}
                  >
                    {cat.label}
                  </span>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-semibold text-slate-900 text-[15px] mb-1 leading-snug">
                    {act.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                    <span>{formatDuration(act.duration)}</span>
                    <span>·</span>
                    <span>Tối đa {act.maxSlots}</span>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed flex-1 line-clamp-2 mb-4">
                    {act.description}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span
                      className={`font-bold text-sm ${
                        act.price === 0 ? "text-emerald-600" : "text-slate-800"
                      }`}
                    >
                      {formatActivityPrice(act.price)}
                    </span>
                    <span className="text-xs text-emerald-600 font-semibold group-hover:text-emerald-700 flex items-center gap-1">
                      Đặt lịch
                      <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
