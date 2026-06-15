"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCustomerAuth } from "@/lib/customer-auth";
import { SiteNav } from "@/components/site-nav";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type WishlistItem = {
  id: string;
  roomType: {
    id: string; name: string; slug: string; basePrice: number; images: string; tagline: string;
  };
  createdAt: string;
};

function formatPrice(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

export default function WishlistPage() {
  const router = useRouter();
  const { user, getHeaders } = useCustomerAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!user) { router.replace("/tai-khoan/dang-nhap?redirect=/tai-khoan/yeu-thich"); return; }
      fetch(`${API}/wishlist`, { headers: getHeaders() })
        .then(r => r.json())
        .then(j => { setItems(j.data ?? []); setLoading(false); })
        .catch(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const remove = async (roomTypeId: string) => {
    await fetch(`${API}/wishlist/${roomTypeId}`, {
      method: "DELETE", headers: getHeaders(),
    });
    setItems(prev => prev.filter(i => i.roomType.id !== roomTypeId));
  };

  if (!user) {
    return (
      <>
        <SiteNav />
        <main className="min-h-screen bg-slate-50 pt-24 pb-16 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="font-serif text-3xl text-slate-300">Phòng yêu thích</h1>
                <div className="h-4 w-32 bg-slate-100 rounded animate-pulse mt-1" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 h-64 animate-pulse" />
              ))}
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl text-slate-900">Phòng yêu thích</h1>
            <p className="text-slate-500 mt-1">{items.length} phòng đã lưu</p>
          </div>
          <Link href="/phong" className="text-sm text-emerald-700 hover:underline">← Xem tất cả phòng</Link>
        </div>

        {loading ? (
          <div className="text-center text-slate-400 py-16">Đang tải...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">💔</div>
            <h2 className="font-serif text-2xl text-slate-700 mb-2">Chưa có phòng yêu thích</h2>
            <p className="text-slate-500 mb-6">Nhấn vào icon trái tim trên card phòng để lưu lại</p>
            <Link href="/phong" className="px-6 py-3 bg-[#1B4332] text-white rounded-xl font-semibold hover:bg-[#2D6A4F]">
              Khám phá phòng
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map(item => {
              const images = JSON.parse(item.roomType.images || "[]") as string[];
              return (
                <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 group">
                  <div className="relative h-48">
                    {images[0] && (
                      <Image src={images[0]} alt={item.roomType.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <button
                      onClick={() => remove(item.roomType.id)}
                      className="absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      aria-label="Xóa khỏi yêu thích"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-800">{item.roomType.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{item.roomType.tagline}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <span className="text-sm font-bold text-emerald-700">{formatPrice(item.roomType.basePrice)}</span>
                        <span className="text-xs text-slate-400">/đêm</span>
                      </div>
                      <Link
                        href={`/dat-phong?room=${item.roomType.slug}`}
                        className="px-4 py-2 bg-[#1B4332] text-white text-xs font-semibold rounded-lg hover:bg-[#2D6A4F] transition-colors"
                      >
                        Đặt ngay
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
