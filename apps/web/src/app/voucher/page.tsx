import type { Metadata } from "next";
import { VoucherPurchaseForm } from "./voucher-form";

export const metadata: Metadata = {
  title: "Gift Voucher — Trầm Hương Eco-Resort",
  description: "Tặng trải nghiệm nghỉ dưỡng sinh thái tại Trầm Hương cho người thân. Mua Gift Voucher — quà tặng ý nghĩa nhất.",
};

export default function VoucherPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#1B4332] to-[#2D6A4F] pt-32 pb-24 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block bg-amber-400/20 text-amber-300 text-xs font-semibold tracking-[0.2em] uppercase px-4 py-2 rounded-full mb-6">
            🎁 Gift Voucher
          </span>
          <h1 className="font-serif text-4xl lg:text-5xl text-white mb-5">
            Tặng trải nghiệm<br />thiên nhiên
          </h1>
          <p className="text-emerald-200 text-lg leading-relaxed">
            Voucher nghỉ dưỡng tại Trầm Hương — món quà ý nghĩa cho mọi dịp.
            Áp dụng khi đặt phòng online, hiệu lực 1 năm.
          </p>
        </div>

        {/* Voucher values */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[500_000, 1_000_000, 2_000_000].map((v) => (
            <div key={v}
              className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-300">
                {(v / 1_000_000).toFixed(v >= 1_000_000 ? 0 : 1)}M
              </p>
              <p className="text-emerald-300 text-xs mt-1">VND</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <VoucherPurchaseForm />

        {/* Notes */}
        <div className="mt-8 text-center text-emerald-300/70 text-sm space-y-1">
          <p>✓ Mã voucher gửi qua email ngay sau khi tạo</p>
          <p>✓ Hiệu lực 12 tháng kể từ ngày mua</p>
          <p>✓ Áp dụng cho tất cả loại phòng</p>
          <p>✓ Không hoàn lại tiền mặt</p>
        </div>
      </div>
    </main>
  );
}
