import Image from "next/image";
import Link from "next/link";
import { PACKAGES, formatPackagePrice } from "@/lib/package-data";

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

export function PackagesSection() {
  return (
    <section className="py-24 lg:py-32 bg-emerald-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-emerald-400 text-xs font-semibold tracking-[0.2em] uppercase mb-4">
            Gói nghỉ dưỡng
          </p>
          <h2 className="font-serif text-4xl lg:text-5xl text-white mb-4">
            Trọn gói, tiết kiệm hơn
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Các gói được thiết kế sẵn — kết hợp phòng nghỉ và trải nghiệm với giá ưu đãi hơn đặt lẻ.
          </p>
        </div>

        {/* Package cards */}
        <div className="grid lg:grid-cols-3 gap-6">
          {PACKAGES.map((pkg) => {
            const savings = pkg.originalPrice - pkg.packagePrice;
            return (
              <div
                key={pkg.slug}
                className="bg-white rounded-3xl overflow-hidden flex flex-col group hover:-translate-y-1.5 transition-transform duration-300"
              >
                {/* Image header */}
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={pkg.image}
                    alt={pkg.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${pkg.gradient} opacity-50`} />
                  {pkg.badge && (
                    <span className="absolute top-4 left-4 bg-amber-400 text-amber-900 text-[11px] font-bold px-3 py-1 rounded-full">
                      {pkg.badge}
                    </span>
                  )}
                  <div className="absolute bottom-4 left-5 right-5">
                    <span className="text-3xl">{pkg.emoji}</span>
                    <h3 className="font-serif text-2xl font-bold text-white mt-1">{pkg.name}</h3>
                    <p className="text-white/80 text-sm">{pkg.tagline}</p>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 flex flex-col flex-1">
                  <p className="text-slate-500 text-sm leading-relaxed mb-5">{pkg.description}</p>

                  <ul className="space-y-2 mb-6 flex-1">
                    {pkg.includes.map((item) => (
                      <li key={item} className="flex gap-2.5 text-sm text-slate-700">
                        <CheckIcon />
                        {item}
                      </li>
                    ))}
                  </ul>

                  {/* Price */}
                  <div className="border-t border-slate-100 pt-4 mb-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs text-slate-400 line-through">{formatPackagePrice(pkg.originalPrice)}</p>
                        <p className="text-2xl font-bold text-emerald-700">{formatPackagePrice(pkg.packagePrice)}</p>
                      </div>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                        Tiết kiệm {formatPackagePrice(savings)}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/dat-phong?room=${pkg.roomSlug}&package=${pkg.slug}`}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-center text-sm transition-colors"
                  >
                    Đặt gói này
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-white/40 text-sm mt-8">
          Cần gói riêng cho đoàn / sự kiện? Liên hệ <a href="tel:0932183605" className="text-emerald-400 font-semibold hover:underline">0932 183 605</a>
        </p>
      </div>
    </section>
  );
}
