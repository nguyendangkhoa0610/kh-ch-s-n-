const STATS = [
  { value: "12 ha", label: "Diện tích khuôn viên" },
  { value: "24", label: "Phòng & bungalow" },
  { value: "15+", label: "Hoạt động trải nghiệm" },
  { value: "100%", label: "Nguyên liệu địa phương" },
];

const VALUES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
    title: "Gần gũi thiên nhiên",
    desc: "Kiến trúc hòa quyện với cảnh quan, không phá vỡ vẻ đẹp nguyên sơ.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
    title: "Phục vụ tận tâm",
    desc: "Đội ngũ địa phương am hiểu văn hóa, sẵn sàng tạo kỳ nghỉ ý nghĩa.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.893 13.393l-1.135-1.135a2.252 2.252 0 01-.421-.585l-1.08-2.16a.414.414 0 00-.663-.107.827.827 0 01-.812.21l-1.273-.363a.89.89 0 00-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.212.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 01-1.81 1.025 1.055 1.055 0 01-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.655-.261a2.25 2.25 0 01-1.383-2.46l.007-.042a2.25 2.25 0 01.29-.787l.09-.15a2.25 2.25 0 012.37-1.048l1.178.236a1.125 1.125 0 001.302-.795l.208-.73a1.125 1.125 0 00-.578-1.315l-.665-.332-.091.091a2.25 2.25 0 01-1.591.659h-.18c-.249 0-.487.1-.662.274a.931.931 0 01-1.458-1.137l1.411-2.353a2.25 2.25 0 00.286-.76m11.928 9.869A9 9 0 008.965 3.525m11.928 9.868A9 9 0 118.965 3.525" />
      </svg>
    ),
    title: "Bền vững thực sự",
    desc: "Năng lượng mặt trời, nước mưa tái chế, không dùng nhựa dùng một lần.",
  },
];

export function AboutSection() {
  return (
    <section id="gioi-thieu" className="py-24 lg:py-32 bg-amber-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="grid lg:grid-cols-2 gap-16 items-start mb-20">
          <div>
            <p className="text-emerald-600 text-xs font-semibold tracking-[0.2em] uppercase mb-5">
              Câu chuyện của chúng tôi
            </p>
            <h2 className="font-serif text-4xl lg:text-5xl text-slate-900 leading-[1.15] mb-8">
              Nơi trầm tích trở thành{" "}
              <em className="not-italic text-emerald-700">kỷ niệm</em>
            </h2>
            <a
              href="#phong"
              className="inline-flex items-center gap-2 text-emerald-600 font-semibold text-sm hover:gap-3 transition-all duration-200 group"
            >
              Xem các loại phòng
              <svg
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </a>
          </div>

          <div className="space-y-5 text-slate-600 text-[17px] leading-relaxed">
            <p>
              Trầm Hương Eco-Resort được xây dựng trong lòng vùng rừng núi Bình
              Định — mảnh đất huyền thoại của trầm hương quý hiếm. Mỗi chi tiết
              được thiết kế để hòa quyện với thiên nhiên, không phá vỡ vẻ đẹp
              nguyên sơ vốn có.
            </p>
            <p>
              Chúng tôi tin rằng kỳ nghỉ lý tưởng không phải là xa rời cuộc
              sống, mà là tìm lại nhịp thở tự nhiên của bản thân. Giữa tiếng
              suối, bóng cây và hương trầm nhẹ phảng phất — đó là nơi bạn thuộc
              về.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-3xl p-7 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-200"
            >
              <p className="font-serif text-4xl font-bold text-emerald-700 mb-2">
                {stat.value}
              </p>
              <p className="text-slate-500 text-sm leading-snug">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Values */}
        <div className="grid md:grid-cols-3 gap-6">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="flex gap-4 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                {v.icon}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">{v.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
