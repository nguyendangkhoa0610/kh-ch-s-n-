import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ROOM_TYPES } from "@/lib/room-data";
import { fetchDBRoomTypes } from "@/lib/api";
import { RoomsListing } from "./rooms-listing";

export const metadata: Metadata = {
  title: "Phòng & Bungalow — Trầm Hương Eco-Resort",
  description: "Từ lều glamping tiết kiệm đến suite trầm hương xa xỉ — mỗi không gian là một trải nghiệm riêng biệt.",
};

export default async function PhongPage() {
  // Fetch DB data và merge với static (DB ưu tiên)
  const dbTypes = await fetchDBRoomTypes();
  const parseJSON = (s: string, fb: string[]) => { try { return JSON.parse(s) as string[] } catch { return fb } }

  const rooms = ROOM_TYPES.map((staticRoom) => {
    const db = dbTypes.find(t => t.slug === staticRoom.slug);
    if (!db) return staticRoom;
    return {
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
    };
  });

  return (
    <>
      <SiteNav />
      <section className="pt-[72px] bg-emerald-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
          <p className="text-emerald-400 text-xs font-semibold tracking-[0.2em] uppercase mb-4">Chỗ nghỉ</p>
          <h1 className="font-serif text-4xl lg:text-5xl text-white mb-5">Phòng & Bungalow</h1>
          <p className="text-white/60 text-lg max-w-2xl leading-relaxed">
            Từ lều glamping tiết kiệm đến suite trầm hương xa xỉ — mỗi không gian là một trải nghiệm riêng biệt, tất cả đều giữa thiên nhiên thuần khiết.
          </p>
        </div>
      </section>
      <main className="bg-slate-50 min-h-screen">
        <RoomsListing rooms={rooms} />
      </main>
      <SiteFooter />
    </>
  );
}
