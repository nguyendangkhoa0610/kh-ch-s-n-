import { Suspense } from "react";
import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { PaymentResult } from "./payment-result";

export const metadata: Metadata = {
  title: "Kết quả thanh toán — Trầm Hương Eco-Resort",
};

export default function KetQuaPage() {
  return (
    <>
      <SiteNav />
      <main className="pt-[72px] min-h-screen bg-slate-50">
        <div className="max-w-lg mx-auto px-6 py-16">
          <Suspense
            fallback={
              <div className="flex flex-col items-center py-20 text-slate-400 gap-4">
                <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Đang xác minh giao dịch...
              </div>
            }
          >
            <PaymentResult />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
