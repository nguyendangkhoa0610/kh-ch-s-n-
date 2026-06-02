import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Điều khoản dịch vụ — Trầm Hương Eco-Resort",
};

export default function DieuKhoanPage() {
  return (
    <>
      <SiteNav />
      <section className="pt-[72px] bg-emerald-950">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-14">
          <h1 className="font-serif text-4xl text-white mb-3">Điều khoản dịch vụ</h1>
          <p className="text-white/50 text-sm">Cập nhật lần cuối: 01/06/2026</p>
        </div>
      </section>
      <main className="bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-14 prose prose-slate max-w-none">
          <h2>1. Đặt phòng và xác nhận</h2>
          <p>Đặt phòng chỉ được xác nhận sau khi thanh toán đặt cọc 30% tổng giá trị. Resort có quyền huỷ đặt phòng nếu không nhận được đặt cọc trong vòng 24 giờ.</p>

          <h2>2. Chính sách huỷ phòng</h2>
          <ul>
            <li>Huỷ trước 7 ngày: hoàn 100% đặt cọc</li>
            <li>Huỷ trước 3 ngày: hoàn 50% đặt cọc</li>
            <li>Huỷ trong vòng 3 ngày: không hoàn đặt cọc</li>
          </ul>

          <h2>3. Check-in / Check-out</h2>
          <p>Check-in: từ 14:00. Check-out: trước 12:00. Yêu cầu check-in sớm hoặc check-out muộn phải thông báo trước và có thể tính thêm phí.</p>

          <h2>4. Quy định tại resort</h2>
          <p>Khách vui lòng tuân thủ nội quy khu nghỉ dưỡng, giữ gìn môi trường sinh thái, không gây ồn ào sau 22:00 và không mang thú cưng vào khu vực phòng nghỉ.</p>

          <h2>5. Trách nhiệm</h2>
          <p>Resort không chịu trách nhiệm đối với tài sản cá nhân bị mất mát. Khách được khuyến khích sử dụng két an toàn trong phòng.</p>

          <h2>6. Liên hệ</h2>
          <p>Trầm Hương Eco-Resort · Xã Cát Khánh, Phù Cát, Bình Định<br />
          Điện thoại: 0932 183 605 · Email: hello@tramhuong-resort.vn</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
