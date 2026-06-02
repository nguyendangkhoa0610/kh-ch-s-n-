import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Chính sách bảo mật — Trầm Hương Eco-Resort",
};

export default function ChinhSachBaoMatPage() {
  return (
    <>
      <SiteNav />
      <section className="pt-[72px] bg-emerald-950">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-14">
          <h1 className="font-serif text-4xl text-white mb-3">Chính sách bảo mật</h1>
          <p className="text-white/50 text-sm">Cập nhật lần cuối: 01/06/2026</p>
        </div>
      </section>
      <main className="bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-14 prose prose-slate max-w-none">
          <h2>1. Thông tin chúng tôi thu thập</h2>
          <p>Khi bạn đặt phòng hoặc sử dụng dịch vụ của Trầm Hương Eco-Resort, chúng tôi có thể thu thập: họ tên, địa chỉ email, số điện thoại, thông tin thanh toán và lịch sử đặt phòng.</p>

          <h2>2. Cách chúng tôi sử dụng thông tin</h2>
          <p>Thông tin cá nhân của bạn được dùng để: xác nhận và quản lý đặt phòng, liên lạc về dịch vụ, gửi xác nhận thanh toán và cải thiện trải nghiệm của bạn tại resort.</p>

          <h2>3. Bảo mật dữ liệu</h2>
          <p>Chúng tôi áp dụng các biện pháp bảo mật kỹ thuật và tổ chức phù hợp để bảo vệ thông tin cá nhân của bạn khỏi truy cập trái phép, mất mát hoặc tiết lộ.</p>

          <h2>4. Chia sẻ thông tin</h2>
          <p>Chúng tôi không bán, trao đổi hoặc chuyển nhượng thông tin cá nhân của bạn cho bên thứ ba, ngoại trừ các đối tác thanh toán (VNPay) cần thiết để hoàn tất giao dịch.</p>

          <h2>5. Quyền của bạn</h2>
          <p>Bạn có quyền yêu cầu truy cập, chỉnh sửa hoặc xóa thông tin cá nhân của mình. Vui lòng liên hệ: <a href="mailto:hello@tramhuong-resort.vn">hello@tramhuong-resort.vn</a></p>

          <h2>6. Liên hệ</h2>
          <p>Trầm Hương Eco-Resort · Xã Cát Khánh, Phù Cát, Bình Định<br />
          Điện thoại: 0932 183 605 · Email: hello@tramhuong-resort.vn</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
