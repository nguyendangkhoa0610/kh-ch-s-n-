import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Giới thiệu — Trầm Hương Eco-Resort",
  description:
    "Câu chuyện về Trầm Hương Eco-Resort — khu nghỉ dưỡng sinh thái cao cấp giữa núi rừng Bình Định.",
};

const TIMELINE = [
  {
    year: "2019",
    title: "Khởi đầu từ một ước mơ",
    desc: "Nhận thấy Bình Định có thiên nhiên hoang sơ tuyệt vời nhưng thiếu điểm nghỉ dưỡng xứng tầm, chúng tôi bắt đầu khảo sát và mua lại 12 ha đất rừng tại Phù Cát.",
  },
  {
    year: "2021",
    title: "Xây dựng theo nguyên tắc eco",
    desc: "Toàn bộ vật liệu được lấy từ địa phương, không dùng bê tông cốt thép trong khu rừng, giữ nguyên tối đa cây xanh tự nhiên. Mỗi bungalow mất 6 tháng để hoàn thành.",
  },
  {
    year: "2022",
    title: "Mở cửa đón khách đầu tiên",
    desc: "8 bungalow và 4 nhà sàn đầu tiên đi vào hoạt động. Mùa hè 2022, resort đạt tỷ lệ lấp đầy 85% nhờ truyền miệng từ khách hàng.",
  },
  {
    year: "2023",
    title: "Mở rộng & hoàn thiện",
    desc: "Ra mắt Eco Pod, Villa Gia Đình và khu spa trầm hương. Hệ thống năng lượng mặt trời cung cấp 70% điện tiêu thụ toàn resort.",
  },
  {
    year: "2024",
    title: "Công nhận & phát triển",
    desc: "Nhận chứng nhận du lịch xanh từ Bộ VH-TT-DL. Mở thêm Lều Đồng Cỏ và Suite Trầm Hương cao cấp, nâng tổng sức chứa lên 24 phòng.",
  },
  {
    year: "2026",
    title: "Số hoá trải nghiệm",
    desc: "Ra mắt hệ thống đặt phòng trực tuyến, app khách hàng với digital room key và AI concierge — giữ nguyên hồn sinh thái, thêm tiện ích công nghệ.",
  },
];

const VALUES = [
  {
    emoji: "🌿",
    title: "Bền vững thực sự",
    desc: "Không phải khẩu hiệu — chúng tôi đo lường lượng carbon hàng tháng, tái chế 90% rác thải, và trồng 3 cây mới cho mỗi cây cũ bị ảnh hưởng bởi xây dựng.",
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    emoji: "🏘",
    title: "Cộng đồng địa phương",
    desc: "95% nhân viên là người Bình Định. Nguyên liệu ẩm thực mua trực tiếp từ nông dân và ngư dân quanh vùng. Mỗi đồng khách chi tiêu ở lại trong tỉnh.",
    color: "bg-amber-50 text-amber-700",
  },
  {
    emoji: "✨",
    title: "Trải nghiệm tinh tế",
    desc: "Không kén khách, không phô trương. Mỗi chi tiết nhỏ được chăm chút — từ loại gỗ làm sàn đến thảo mộc trong gối ngủ — đều có lý do và câu chuyện.",
    color: "bg-violet-50 text-violet-700",
  },
];

const TEAM = [
  { name: "Nguyễn Văn Tâm", role: "Nhà sáng lập & Giám đốc", emoji: "👨‍💼" },
  { name: "Lê Thị Hương", role: "Quản lý trải nghiệm khách", emoji: "👩‍💼" },
  { name: "Trần Minh Khoa", role: "Bếp trưởng", emoji: "👨‍🍳" },
  { name: "Phạm Thị Lan", role: "Trưởng bộ phận spa & wellness", emoji: "👩‍⚕️" },
];

const CERTIFICATIONS = [
  { icon: "🌱", label: "Du lịch xanh", sub: "Bộ VH-TT-DL · 2024" },
  { icon: "☀️", label: "Năng lượng tái tạo", sub: "70% từ mặt trời" },
  { icon: "♻️", label: "Zero plastic resort", sub: "Không nhựa dùng 1 lần" },
  { icon: "🐟", label: "Bảo tồn biển", sub: "Đối tác WWF Việt Nam" },
];

export default function GioiThieuPage() {
  return (
    <>
      <SiteNav />

      {/* Hero */}
      <section className="pt-[72px] bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #10b981 0%, transparent 70%)" }}
        />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-28 relative">
          <p className="text-emerald-400 text-xs font-semibold tracking-[0.2em] uppercase mb-5">
            Câu chuyện của chúng tôi
          </p>
          <h1 className="font-serif text-5xl lg:text-6xl text-white font-semibold mb-6 max-w-3xl leading-tight">
            Một khu rừng trầm, một giấc mơ xanh
          </h1>
          <p className="text-white/60 text-lg max-w-2xl leading-relaxed mb-10">
            Trầm Hương Eco-Resort ra đời từ niềm tin rằng du lịch cao cấp và bảo vệ
            thiên nhiên không mâu thuẫn nhau — nếu ta làm đúng từ đầu.
          </p>
          <div className="flex flex-wrap gap-6">
            {[
              { value: "7 năm", label: "xây dựng & phát triển" },
              { value: "12 ha", label: "rừng được bảo tồn" },
              { value: "95%", label: "nhân viên địa phương" },
              { value: "5.000+", label: "lượt khách mỗi năm" },
            ].map((s) => (
              <div key={s.label} className="text-white">
                <p className="font-serif text-3xl font-bold text-emerald-300">{s.value}</p>
                <p className="text-white/50 text-sm mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main>
        {/* Brand story */}
        <section className="py-24 bg-amber-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              <div>
                <p className="text-emerald-600 text-xs font-semibold tracking-[0.2em] uppercase mb-5">
                  Triết lý
                </p>
                <h2 className="font-serif text-4xl text-slate-900 mb-6 leading-snug">
                  Trầm hương dạy chúng tôi điều gì
                </h2>
                <div className="space-y-4 text-slate-600 text-[17px] leading-relaxed">
                  <p>
                    Trầm hương — loại gỗ quý nhất thế giới — chỉ hình thành khi
                    cây dó bầu bị thương. Từ vết thương, nhựa tiết ra, tích tụ
                    qua nhiều năm, cuối cùng tạo thành hương liệu đắt giá nhất
                    hành tinh.
                  </p>
                  <p>
                    Chúng tôi học từ đó: điều tốt đẹp cần thời gian. Resort không
                    được xây vội, không ép thiên nhiên theo ý con người, không
                    đánh đổi chất lượng để có quy mô. Mỗi chi tiết ở đây được
                    chắt lọc qua nhiều năm — như trầm.
                  </p>
                  <p>
                    Đó cũng là lý do chúng tôi chỉ có 24 phòng. Không phải vì
                    không có đất — 12 ha đủ để xây trăm phòng. Mà vì chúng tôi
                    biết giới hạn của sự tinh tế.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { bg: "from-emerald-800 to-teal-900", label: "Rừng trầm hương" },
                  { bg: "from-amber-800 to-orange-900", label: "Kiến trúc gỗ tự nhiên" },
                  { bg: "from-sky-800 to-cyan-900", label: "Bãi biển riêng" },
                  { bg: "from-violet-800 to-purple-900", label: "Khu spa cao cấp" },
                ].map((img) => (
                  <div
                    key={img.label}
                    className={`h-44 rounded-2xl bg-gradient-to-br ${img.bg} flex items-end p-4`}
                  >
                    <span className="text-white/70 text-xs font-medium">{img.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-24 bg-white">
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-emerald-600 text-xs font-semibold tracking-[0.2em] uppercase mb-4">
                Hành trình
              </p>
              <h2 className="font-serif text-4xl text-slate-900">
                Từ khu rừng hoang đến resort xanh
              </h2>
            </div>
            <div className="relative">
              {/* Line */}
              <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-slate-200" />
              <div className="space-y-10">
                {TIMELINE.map((item, i) => (
                  <div key={item.year} className="flex gap-6">
                    {/* Dot */}
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs ring-4 ring-white">
                        {i + 1}
                      </div>
                    </div>
                    <div className="pb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-emerald-600 font-bold text-sm">{item.year}</span>
                        <h3 className="font-semibold text-slate-900">{item.title}</h3>
                      </div>
                      <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-emerald-600 text-xs font-semibold tracking-[0.2em] uppercase mb-4">
                Giá trị cốt lõi
              </p>
              <h2 className="font-serif text-4xl text-slate-900">
                Chúng tôi cam kết điều gì
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {VALUES.map((v) => (
                <div
                  key={v.title}
                  className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-6 ${v.color}`}
                  >
                    {v.emoji}
                  </div>
                  <h3 className="font-serif text-xl text-slate-900 mb-3">{v.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Certifications */}
        <section className="py-16 bg-emerald-950">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {CERTIFICATIONS.map((c) => (
                <div
                  key={c.label}
                  className="flex items-center gap-4 bg-white/10 rounded-2xl p-5 border border-white/10"
                >
                  <span className="text-3xl">{c.icon}</span>
                  <div>
                    <p className="text-white font-semibold text-sm">{c.label}</p>
                    <p className="text-white/50 text-xs">{c.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-24 bg-amber-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-emerald-600 text-xs font-semibold tracking-[0.2em] uppercase mb-4">
                Đội ngũ
              </p>
              <h2 className="font-serif text-4xl text-slate-900 mb-4">
                Con người tạo nên Trầm Hương
              </h2>
              <p className="text-slate-500 text-lg max-w-xl mx-auto">
                Mỗi người trong team mang một câu chuyện, một tình yêu với Bình Định
                và sự cam kết với khách hàng.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {TEAM.map((member) => (
                <div
                  key={member.name}
                  className="bg-white rounded-3xl p-7 text-center shadow-sm border border-slate-100"
                >
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
                    {member.emoji}
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">{member.name}</h3>
                  <p className="text-emerald-600 text-sm">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <p className="text-emerald-600 text-xs font-semibold tracking-[0.2em] uppercase mb-4">
                  Vị trí
                </p>
                <h2 className="font-serif text-4xl text-slate-900 mb-6">
                  Cách trung tâm Quy Nhơn 40 phút
                </h2>
                <div className="space-y-4 text-slate-600 text-sm">
                  {[
                    { icon: "📍", text: "Xã Cát Khánh, huyện Phù Cát, Bình Định" },
                    { icon: "✈️", text: "Sân bay Phù Cát: 15 phút (đưa đón miễn phí)" },
                    { icon: "🚗", text: "TP. Quy Nhơn: 40 phút theo QL19B" },
                    { icon: "🚆", text: "Ga Diêu Trì: 25 phút" },
                  ].map((loc) => (
                    <div key={loc.text} className="flex items-center gap-3">
                      <span className="text-xl shrink-0">{loc.icon}</span>
                      <span>{loc.text}</span>
                    </div>
                  ))}
                </div>
                <p className="text-slate-400 text-sm mt-6 italic">
                  Chúng tôi có dịch vụ đưa đón từ sân bay và ga tàu theo yêu cầu.
                </p>
              </div>
              {/* Google Maps */}
              <div className="h-80 rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
                <iframe
                  src="https://maps.google.com/maps?q=13.7829,109.2196&z=15&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Vị trí Trầm Hương Eco-Resort"
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-emerald-600">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="font-serif text-4xl text-white mb-4">
              Sẵn sàng trải nghiệm chưa?
            </h2>
            <p className="text-emerald-100 text-lg mb-8">
              Đặt phòng ngay hôm nay và nhận ưu đãi 10% cho lần đầu tiên.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dat-phong"
                className="px-8 py-4 bg-white text-emerald-700 font-bold rounded-full hover:bg-emerald-50 transition-colors text-sm"
              >
                Đặt phòng ngay
              </Link>
              <Link
                href="/phong"
                className="px-8 py-4 bg-emerald-700 text-white font-semibold rounded-full hover:bg-emerald-800 transition-colors text-sm"
              >
                Xem các loại phòng
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
