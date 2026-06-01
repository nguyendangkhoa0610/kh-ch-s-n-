import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ResortMap } from "@/components/resort-map";

export const metadata: Metadata = {
  title: "Bản đồ khu resort — Trầm Hương Eco-Resort",
  description:
    "Khám phá bản đồ khuôn viên Trầm Hương Eco-Resort — vị trí các phòng, nhà hàng, hồ bơi, spa và tiện ích.",
};

export default function BanDoPage() {
  return (
    <>
      <SiteNav />

      <section className="pt-[72px] bg-emerald-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
          <p className="text-emerald-400 text-xs font-semibold tracking-[0.2em] uppercase mb-4">
            Khám phá
          </p>
          <h1 className="font-serif text-4xl lg:text-5xl text-white mb-4">
            Bản đồ khu resort
          </h1>
          <p className="text-white/60 text-lg max-w-2xl">
            Nhấn vào bất kỳ vị trí nào để xem thông tin. Khuôn viên rộng 12
            hecta — đủ để lạc, nhưng không bao giờ thực sự lạc.
          </p>
        </div>
      </section>

      <main className="bg-slate-100 min-h-screen">
        <ResortMap />
      </main>

      <SiteFooter />
    </>
  );
}
