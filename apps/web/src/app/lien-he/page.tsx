import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ContactForm } from "./contact-form";
import { JsonLd } from "@/components/json-ld";

export const metadata: Metadata = {
  title: "Liên hệ — Trầm Hương Eco-Resort",
  description: "Liên hệ với Trầm Hương Eco-Resort qua điện thoại, email hoặc Zalo. Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7.",
};

const CONTACTS = [
  {
    icon: "📞",
    title: "Điện thoại",
    value: "0932 183 605",
    sub: "Lễ tân 24/7",
    href: "tel:0932183605",
    cta: "Gọi ngay",
  },
  {
    icon: "💬",
    title: "Zalo",
    value: "0932 183 605",
    sub: "Phản hồi trong 5 phút",
    href: "https://zalo.me/0932183605",
    cta: "Chat Zalo",
  },
  {
    icon: "✉️",
    title: "Email",
    value: "hello@tramhuong-resort.vn",
    sub: "Phản hồi trong 2–4 giờ",
    href: "mailto:hello@tramhuong-resort.vn",
    cta: "Gửi email",
  },
  {
    icon: "📍",
    title: "Địa chỉ",
    value: "Xã Cát Khánh, Phù Cát",
    sub: "Bình Định, Việt Nam",
    href: "/ban-do",
    cta: "Xem bản đồ",
  },
];

const FAQS = [
  {
    q: "Check-in và check-out lúc mấy giờ?",
    a: "Check-in từ 14:00, check-out trước 12:00 trưa. Late check-out có thể sắp xếp tùy theo phòng trống, liên hệ lễ tân trước.",
  },
  {
    q: "Resort có shuttle từ sân bay không?",
    a: "Có — chúng tôi cung cấp dịch vụ đưa đón miễn phí từ Sân bay Phù Cát (25 phút). Vui lòng báo lịch bay khi đặt phòng.",
  },
  {
    q: "Bữa sáng có bao gồm trong giá phòng không?",
    a: "Có, tất cả các gói phòng đều bao gồm bữa sáng tại Nhà hàng Trầm từ 06:30–09:30.",
  },
  {
    q: "Có thể hủy đặt phòng không?",
    a: "Hủy miễn phí trước 48 giờ nhận phòng. Hủy trong vòng 48 giờ mất 50% tiền đặt cọc. Không hoàn cọc nếu hủy trong 24 giờ.",
  },
  {
    q: "Resort có phù hợp cho gia đình có trẻ nhỏ không?",
    a: "Hoàn toàn phù hợp! Chúng tôi có Villa Gia Đình rộng rãi, hồ bơi an toàn, khu vui chơi ngoài trời và các hoạt động Eco Challenge thú vị cho trẻ.",
  },
  {
    q: "WiFi ở đâu và mật khẩu là gì?",
    a: "WiFi miễn phí phủ toàn khu resort. Tên mạng: TramHuong_Resort | Mật khẩu: tramhuong2026",
  },
];

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map(f => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function ContactPage() {
  return (
    <>
      <JsonLd data={FAQ_SCHEMA} />
      <SiteNav />

      <section className="pt-[72px] bg-gradient-to-br from-emerald-950 to-slate-900 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-emerald-400 text-xs font-semibold tracking-[0.2em] uppercase mb-4">Liên hệ</p>
          <h1 className="font-serif text-4xl lg:text-5xl text-white mb-4">Chúng tôi luôn ở đây</h1>
          <p className="text-white/60 text-lg">Dù câu hỏi lớn hay nhỏ — đội ngũ Trầm Hương sẵn sàng 24/7.</p>
        </div>
      </section>

      <main className="bg-slate-50 py-16 px-6">
        <div className="max-w-4xl mx-auto">

          {/* Contact cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            {CONTACTS.map(c => (
              <a key={c.title} href={c.href}
                className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-emerald-300 hover:shadow-sm transition-all group text-center">
                <div className="text-4xl mb-3">{c.icon}</div>
                <p className="font-semibold text-slate-800 text-sm mb-0.5">{c.title}</p>
                <p className="text-emerald-700 font-bold text-sm mb-1">{c.value}</p>
                <p className="text-xs text-slate-400 mb-3">{c.sub}</p>
                <span className="text-xs font-semibold text-emerald-600 group-hover:underline">{c.cta} →</span>
              </a>
            ))}
          </div>

          {/* Form + Map grid */}
          <div className="grid lg:grid-cols-[1fr_420px] gap-8 mb-16">
            {/* Contact form */}
            <ContactForm />

            {/* Google Maps */}
            <div className="space-y-4">
              <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: 320 }}>
                <iframe
                  src="https://maps.google.com/maps?q=13.7829,109.2196&z=14&output=embed"
                  width="100%"
                  height="320"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Vị trí Trầm Hương Eco-Resort"
                />
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                {[
                  { icon: "📍", label: "Xã Cát Khánh, Phù Cát, Bình Định" },
                  { icon: "✈️", label: "Sân bay Phù Cát: 15 phút (miễn phí đưa đón)" },
                  { icon: "🚗", label: "TP. Quy Nhơn: 40 phút theo QL19B" },
                  { icon: "🕐", label: "Check-in: 14:00 · Check-out: 12:00" },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-3">
                    <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
                    <span className="text-sm text-slate-600">{item.label}</span>
                  </div>
                ))}
                <a
                  href="https://maps.google.com/?q=13.7829,109.2196"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:underline mt-1"
                >
                  Mở Google Maps →
                </a>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div>
            <h2 className="font-serif text-2xl text-slate-900 mb-8 text-center">Câu hỏi thường gặp</h2>
            <div className="space-y-4">
              {FAQS.map((faq, i) => (
                <details key={i} className="bg-white rounded-2xl border border-slate-200 group">
                  <summary className="px-6 py-4 cursor-pointer font-semibold text-slate-800 text-sm flex items-center justify-between select-none list-none">
                    {faq.q}
                    <svg className="w-4 h-4 text-slate-400 shrink-0 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center bg-emerald-900 rounded-3xl p-10">
            <h2 className="font-serif text-2xl text-white mb-3">Sẵn sàng đặt phòng?</h2>
            <p className="text-white/60 text-sm mb-6">Chỉ mất 3 phút — đặt phòng trực tiếp với giá tốt nhất.</p>
            <Link href="/dat-phong"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-emerald-800 font-bold rounded-full text-sm hover:bg-emerald-50 transition-colors">
              Đặt phòng ngay
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
