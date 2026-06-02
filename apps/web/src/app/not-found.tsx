import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export default function NotFound() {
  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-slate-50 pt-[72px] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-8xl mb-6">🌿</div>
          <h1 className="font-serif text-4xl text-slate-900 mb-3">Trang không tìm thấy</h1>
          <p className="text-slate-500 text-lg mb-8">
            Có vẻ trang bạn đang tìm không tồn tại hoặc đã được di chuyển.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full text-sm transition-colors"
            >
              Về trang chủ
            </Link>
            <Link
              href="/dat-phong"
              className="px-6 py-3 border-2 border-slate-200 text-slate-600 hover:border-emerald-400 font-semibold rounded-full text-sm transition-colors"
            >
              Đặt phòng
            </Link>
          </div>
          <p className="text-slate-400 text-sm mt-8">
            Cần hỗ trợ? Gọi <a href="tel:0932183605" className="text-emerald-600 font-semibold">0932 183 605</a>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
