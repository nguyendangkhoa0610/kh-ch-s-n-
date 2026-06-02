const REVIEWS = [
  {
    name: "Nguyễn Minh Châu",
    location: "Hà Nội",
    avatar: "NM",
    rating: 5,
    date: "Tháng 4, 2026",
    room: "Villa Gia Đình",
    text: "Không gian xanh mướt, yên tĩnh tuyệt đối. Bungalow view biển tuyệt đẹp, buổi sáng thức dậy nghe tiếng chim hót và nhìn ra biển — cảm giác không thể quên. Nhân viên rất thân thiện và chu đáo.",
  },
  {
    name: "Trần Thị Hương",
    location: "TP. Hồ Chí Minh",
    avatar: "TH",
    rating: 5,
    date: "Tháng 3, 2026",
    room: "Suite Trầm Hương",
    text: "Đây là lần đầu tiên tôi trải nghiệm eco-resort và thực sự bị chinh phục. Mùi trầm hương thoang thoảng khắp nơi, đồ ăn địa phương rất ngon. AI concierge trong app cực kỳ hữu ích khi lên kế hoạch.",
  },
  {
    name: "Lê Anh Tuấn",
    location: "Đà Nẵng",
    avatar: "LA",
    rating: 5,
    date: "Tháng 2, 2026",
    room: "Bungalow View Biển",
    text: "Gia đình tôi đến đây 3 ngày 2 đêm, các con rất thích thú với chương trình Eco Challenge. Lịch trình do AI lên cực kỳ phù hợp với gia đình có trẻ nhỏ. Nhất định sẽ quay lại!",
  },
  {
    name: "Phạm Quỳnh Anh",
    location: "Hà Nội",
    avatar: "PQ",
    rating: 5,
    date: "Tháng 1, 2026",
    room: "Eco Pod",
    text: "Resort xứng đáng 5 sao về trải nghiệm sinh thái. Eco Pod nhỏ nhưng tiện nghi đầy đủ, nằm sát rừng cực lãng mạn. Bãi biển sạch, ít người, rất hợp cho cặp đôi tìm không gian riêng tư.",
  },
  {
    name: "Hoàng Việt Dũng",
    location: "TP. Hồ Chí Minh",
    avatar: "HV",
    rating: 5,
    date: "Tháng 12, 2025",
    room: "Nhà Sàn Rừng",
    text: "Check-in bằng QR code rất tiện lợi, không phải xếp hàng. Nhà sàn giữa rừng là trải nghiệm độc đáo nhất tôi từng có. Buổi tối nghe tiếng côn trùng, uống trà trầm — tuyệt vời!",
  },
  {
    name: "Vũ Thanh Mai",
    location: "Cần Thơ",
    avatar: "VT",
    rating: 5,
    date: "Tháng 11, 2025",
    room: "Lều Đồng Cỏ",
    text: "Giá cả hợp lý so với chất lượng dịch vụ. Nhân viên phục vụ tận tình, bữa sáng với hải sản tươi rất ngon. Cảnh hoàng hôn nhìn từ Lều Đồng Cỏ đẹp không tưởng.",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < rating ? "text-amber-400" : "text-slate-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function ReviewsSection() {
  const avg = (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <p className="text-emerald-600 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
              Đánh giá từ khách hàng
            </p>
            <h2 className="font-serif text-3xl lg:text-4xl text-slate-900">
              Trải nghiệm thật,<br className="hidden sm:block" /> từ khách thật
            </h2>
          </div>
          <div className="flex items-center gap-4 bg-emerald-50 rounded-2xl px-6 py-4 border border-emerald-100">
            <div className="text-center">
              <p className="text-4xl font-bold text-emerald-700">{avg}</p>
              <StarRating rating={5} />
              <p className="text-xs text-slate-500 mt-1">{REVIEWS.length} đánh giá</p>
            </div>
            <div className="text-sm text-slate-600 space-y-1">
              <p>⭐ Dịch vụ xuất sắc</p>
              <p>🌿 Không gian xanh</p>
              <p>🤖 AI Concierge tiện lợi</p>
            </div>
          </div>
        </div>

        {/* Reviews grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REVIEWS.map((review) => (
            <div
              key={review.name}
              className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:border-emerald-200 hover:shadow-sm transition-all"
            >
              {/* Stars + date */}
              <div className="flex items-center justify-between mb-4">
                <StarRating rating={review.rating} />
                <span className="text-xs text-slate-400">{review.date}</span>
              </div>

              {/* Text */}
              <p className="text-slate-600 text-sm leading-relaxed mb-5">
                "{review.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {review.avatar}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{review.name}</p>
                  <p className="text-xs text-slate-400">{review.location} · {review.room}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <a
            href="/dat-phong"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full text-sm transition-colors"
          >
            Trải nghiệm ngay
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>

      </div>
    </section>
  );
}
