import Image from "next/image";
import Link from "next/link";
import { ROOM_TYPES } from "@/lib/room-data";
import { formatPrice } from "@tram-huong/shared";

function PersonIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
    </svg>
  );
}

function SizeIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
    </svg>
  );
}

export function RoomTypesSection() {
  const featured = ROOM_TYPES.slice(0, 4);

  return (
    <section id="phong" className="py-24 lg:py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-emerald-600 text-xs font-semibold tracking-[0.2em] uppercase mb-5">
            Chỗ nghỉ của bạn
          </p>
          <h2 className="font-serif text-4xl lg:text-5xl text-slate-900 mb-5">
            Phòng & Bungalow
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Mỗi không gian là một trải nghiệm riêng biệt — chọn cái phù hợp với hành trình của bạn.
          </p>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featured.map((room) => (
            <Link
              key={room.slug}
              href={`/phong/${room.slug}`}
              className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 border border-slate-100 flex flex-col"
            >
              {/* Thumbnail */}
              <div className="relative h-52 overflow-hidden">
                <Image
                  src={room.images[0]}
                  alt={room.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                {room.badge && (
                  <span className="absolute top-4 left-4 bg-amber-400 text-amber-900 text-[11px] font-semibold px-3 py-1 rounded-full">
                    {room.badge}
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-serif text-[17px] font-semibold text-slate-900 mb-2">
                  {room.name}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-4 flex-1 line-clamp-2">
                  {room.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                  <span className="flex items-center gap-1"><PersonIcon />{room.capacity} khách</span>
                  <span className="flex items-center gap-1"><SizeIcon />{room.size} m²</span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-5">
                  {room.amenities.slice(0, 3).map((a) => (
                    <span key={a} className="text-[11px] px-2 py-0.5 bg-slate-50 text-slate-500 rounded-full border border-slate-100">{a}</span>
                  ))}
                </div>

                <div className="flex items-end justify-between pt-3 border-t border-slate-100">
                  <div>
                    <p className="text-[11px] text-slate-400 mb-0.5">từ</p>
                    <p className="text-emerald-700 font-bold text-base leading-none">{formatPrice(room.price)}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">/đêm</p>
                  </div>
                  <span className="px-4 py-2 text-sm font-semibold rounded-full bg-slate-50 text-slate-700 border border-slate-200 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all duration-200">
                    Xem phòng
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/phong"
            className="inline-flex items-center gap-2 px-8 py-4 border-2 border-emerald-600 text-emerald-700 font-semibold rounded-full hover:bg-emerald-600 hover:text-white transition-all duration-200 text-sm"
          >
            Xem tất cả phòng
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
