"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-7xl mb-5">⚠️</div>
          <h1 className="font-serif text-3xl text-slate-900 mb-3">Có lỗi xảy ra</h1>
          <p className="text-slate-500 mb-6">Trang này gặp sự cố không mong muốn. Vui lòng thử lại.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full text-sm transition-colors"
            >
              Thử lại
            </button>
            <a href="/" className="px-6 py-3 border-2 border-slate-200 text-slate-600 hover:border-emerald-400 font-semibold rounded-full text-sm transition-colors">
              Về trang chủ
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
