import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ROOM_TYPES } from "@/lib/room-data";
import { fetchDBRoomTypes } from "@/lib/api";
import { formatPrice } from "@tram-huong/shared";
import { BookingWidget } from "./booking-widget";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return ROOM_TYPES.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const room = ROOM_TYPES.find((r) => r.slug === slug);
  if (!room) return {};
  return {
    title: `${room.name} — Trầm Hương Eco-Resort`,
    description: room.description,
  };
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-2xl p-4 text-center">
      <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className="text-slate-800 font-semibold text-sm leading-snug">{value}</p>
    </div>
  );
}

export default async function RoomDetailPage({ params }: Props) {
  const { slug } = await params;
  const staticRoom = ROOM_TYPES.find((r) => r.slug === slug);
  if (!staticRoom) notFound();

  // Merge DB data (DB ưu tiên, static làm fallback)
  const dbTypes = await fetchDBRoomTypes();
  const db = dbTypes.find(t => t.slug === slug);
  const parseJSON = (s: string, fb: string[]) => { try { return JSON.parse(s) as string[] } catch { return fb } }
  const room = db ? {
    ...staticRoom,
    name: db.name || staticRoom.name,
    tagline: db.tagline || staticRoom.tagline,
    description: db.description || staticRoom.description,
    price: db.basePrice || staticRoom.price,
    capacity: db.capacity || staticRoom.capacity,
    size: db.size || staticRoom.size,
    bedType: db.bedType || staticRoom.bedType,
    view: db.view || staticRoom.view,
    badge: db.badge ?? staticRoom.badge,
    amenities: parseJSON(db.amenities, staticRoom.amenities),
    images: parseJSON(db.images, staticRoom.images).length > 0
      ? parseJSON(db.images, staticRoom.images)
      : staticRoom.images,
  } : staticRoom;

  const others = ROOM_TYPES.filter((r) => r.slug !== slug).slice(0, 3);

  return (
    <>
      <SiteNav />

      {/* Hero */}
      <section className="pt-[72px] relative overflow-hidden bg-slate-900" style={{ minHeight: 420 }}>
        <Image
          src={room.images[0]}
          alt={room.name}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-28">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-white/50 text-sm mb-8">
            <Link href="/" className="hover:text-white transition-colors">Trang chủ</Link>
            <span>/</span>
            <Link href="/phong" className="hover:text-white transition-colors">Phòng</Link>
            <span>/</span>
            <span className="text-white/80">{room.name}</span>
          </nav>

          {room.badge && (
            <span className="inline-block bg-amber-400 text-amber-900 text-xs font-semibold px-3 py-1 rounded-full mb-4">
              {room.badge}
            </span>
          )}

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-white font-semibold mb-3 leading-tight">
            {room.name}
          </h1>
          <p className="text-white/70 text-xl mb-8">{room.tagline}</p>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-3">
            {[
              { icon: "🛏", text: room.bedType },
              { icon: "👥", text: `${room.capacity} khách` },
              { icon: "📐", text: `${room.size} m²` },
              { icon: "🏔", text: room.view },
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
      </section>

      {/* Main content */}
      <main className="bg-amber-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid lg:grid-cols-[1fr_380px] gap-12">

            {/* Left: details */}
            <div>
              {/* Image gallery */}
              <div className="grid grid-cols-3 gap-3 mb-12">
                <div className="col-span-2 relative h-64 rounded-2xl overflow-hidden">
                  <Image
                    src={room.images[0]}
                    alt={room.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="flex flex-col gap-3">
                  {room.images.slice(1, 3).map((src, i) => (
                    <div key={i} className="flex-1 relative rounded-2xl overflow-hidden">
                      <Image
                        src={src}
                        alt={`${room.name} - ảnh ${i + 2}`}
                        fill
                        sizes="(max-width: 1024px) 50vw, 22vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="mb-10">
                <h2 className="font-serif text-2xl text-slate-900 mb-4">Về phòng này</h2>
                <p className="text-slate-600 text-[17px] leading-relaxed">{room.description}</p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
                <StatCard label="Diện tích" value={`${room.size} m²`} />
                <StatCard label="Sức chứa" value={`${room.capacity} khách`} />
                <StatCard label="Giường" value={room.bedType} />
                <StatCard label="Tầm nhìn" value={room.view} />
              </div>

              {/* Amenities */}
              <div>
                <h2 className="font-serif text-2xl text-slate-900 mb-5">Tiện nghi</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {room.amenities.map((a) => (
                    <div key={a} className="flex items-center gap-3 text-slate-700 text-sm">
                      <CheckIcon />
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: sticky booking card */}
            <div>
              <div className="sticky top-[88px]">
                <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.10)] border border-slate-100 overflow-hidden">
                  {/* Price header */}
                  <div className="relative px-7 py-6 bg-emerald-900 overflow-hidden">
                    <Image src={room.images[0]} alt={room.name} fill sizes="400px" className="object-cover opacity-30" />
                    <p className="text-white/60 text-sm mb-1">Giá từ</p>
                    <p className="text-white font-bold text-3xl font-serif">
                      {formatPrice(room.price)}
                    </p>
                    <p className="text-white/60 text-sm">/đêm · bao gồm thuế</p>
                  </div>

                  {/* Booking form */}
                  <BookingWidget slug={room.slug} capacity={room.capacity} pricePerNight={room.price} />
                </div>

                {/* Contact */}
                <p className="text-center text-sm text-slate-500 mt-4">
                  Cần tư vấn?{" "}
                  <a href="tel:0932183605" className="text-emerald-600 font-semibold hover:underline">
                    Gọi ngay
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Other rooms */}
          <div className="mt-20">
            <h2 className="font-serif text-2xl lg:text-3xl text-slate-900 mb-8">
              Các loại phòng khác
            </h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {others.map((r) => (
                <Link
                  key={r.slug}
                  href={`/phong/${r.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-slate-100 flex flex-col transition-all duration-200 hover:-translate-y-1"
                >
                  <div className="h-36 relative overflow-hidden"><Image src={r.images[0]} alt={r.name} fill sizes="300px" className="object-cover group-hover:scale-105 transition-transform duration-500" /></div>
                  <div className="p-5">
                    <h3 className="font-serif text-base font-semibold text-slate-900 mb-1">{r.name}</h3>
                    <p className="text-emerald-700 font-bold text-sm">
                      {formatPrice(r.price)}<span className="text-slate-400 font-normal">/đêm</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
