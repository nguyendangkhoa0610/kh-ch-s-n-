export type Category = "water" | "land" | "wellness" | "food";

export type Activity = {
  slug: string;
  name: string;
  category: Category;
  tagline: string;
  description: string;
  price: number;
  duration: number;
  maxSlots: number;
  included: string[];
  notes: string[];
  emoji: string;
  gradient: string;
  schedules: string[];
};

export const CATEGORY_META: Record<
  Category,
  { label: string; emoji: string; color: string; bg: string }
> = {
  water: {
    label: "Dưới nước",
    emoji: "🌊",
    color: "text-sky-600",
    bg: "bg-sky-50 border-sky-100",
  },
  land: {
    label: "Trên bờ",
    emoji: "🌿",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-100",
  },
  wellness: {
    label: "Sức khoẻ",
    emoji: "🧘",
    color: "text-violet-600",
    bg: "bg-violet-50 border-violet-100",
  },
  food: {
    label: "Ẩm thực",
    emoji: "🍽",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-100",
  },
};

export const ACTIVITIES: Activity[] = [
  // ── WATER ─────────────────────────────────────────────
  {
    slug: "sup-kayak",
    name: "Chèo SUP & Kayak",
    category: "water",
    tagline: "Khám phá vịnh xanh trên mặt nước",
    description:
      "Chèo thuyền kayak hoặc đứng paddleboard (SUP) dọc bờ vịnh trong buổi sáng yên tĩnh. Hướng dẫn viên đi kèm, phù hợp cả người mới bắt đầu.",
    price: 250_000,
    duration: 90,
    maxSlots: 8,
    included: ["Thiết bị SUP / kayak", "Áo phao", "Hướng dẫn viên", "Nước uống"],
    notes: ["Độ tuổi tối thiểu: 10 tuổi", "Không yêu cầu kinh nghiệm", "Trang phục bơi lội"],
    emoji: "🏄",
    gradient: "from-sky-900 via-cyan-800 to-teal-900",
    schedules: ["07:00", "09:00", "15:00", "17:00"],
  },
  {
    slug: "lan-snorkeling",
    name: "Lặn snorkeling",
    category: "water",
    tagline: "Thế giới san hô ngay dưới chân bạn",
    description:
      "Khám phá rạn san hô đầy màu sắc chỉ cách bờ 200 mét. Nước trong vắt, tầm nhìn xa 10 mét. Thuyền nhỏ đưa đến điểm lặn tốt nhất.",
    price: 350_000,
    duration: 120,
    maxSlots: 6,
    included: ["Bộ snorkel + kính + vây", "Áo phao", "Thuyền đưa đón", "Hướng dẫn viên"],
    notes: ["Biết bơi cơ bản", "Không áp dụng cho trẻ dưới 8 tuổi", "Tùy thuộc điều kiện thời tiết"],
    emoji: "🤿",
    gradient: "from-blue-950 via-cyan-900 to-sky-900",
    schedules: ["08:00", "10:00", "14:00"],
  },
  {
    slug: "danh-ca-dem",
    name: "Đánh cá đêm",
    category: "water",
    tagline: "Ra khơi cùng ngư dân dưới trăng",
    description:
      "Lên thuyền cùng ngư dân địa phương lúc hoàng hôn, thả lưới và câu mực đêm. Cá câu được bếp resort chế biến tươi ngay buổi sáng hôm sau.",
    price: 500_000,
    duration: 180,
    maxSlots: 10,
    included: ["Thuyền + ngư dân dẫn đường", "Cần câu", "Đồ ăn nhẹ trên thuyền", "Áo phao"],
    notes: ["Khởi hành lúc 18:00", "Mặc đồ ấm", "Cá câu được giữ lại nấu ăn"],
    emoji: "🎣",
    gradient: "from-slate-900 via-blue-950 to-indigo-950",
    schedules: ["18:00"],
  },

  // ── LAND ──────────────────────────────────────────────
  {
    slug: "trek-rung-tram",
    name: "Trekking rừng trầm",
    category: "land",
    tagline: "Xuyên rừng trầm hương cùng chuyên gia",
    description:
      "Đi bộ 5 km xuyên khu rừng trầm hương với hướng dẫn viên am hiểu thực vật học. Học nhận biết các loại cây thuốc, ngửi mùi trầm tươi và hiểu vì sao trầm hương Bình Định quý giá.",
    price: 350_000,
    duration: 180,
    maxSlots: 12,
    included: ["Hướng dẫn viên chuyên gia", "Nước uống + trái cây", "Kem chống nắng", "Bản đồ rừng"],
    notes: ["Đi giày thể thao / leo núi", "Độ khó: trung bình", "Mang theo mũ"],
    emoji: "🌿",
    gradient: "from-emerald-950 via-green-900 to-lime-950",
    schedules: ["06:30", "14:00"],
  },
  {
    slug: "dot-lua-trai",
    name: "Đốt lửa trại",
    category: "land",
    tagline: "Quây quần dưới bầu trời sao",
    description:
      "Mỗi tối tại khoảng sân trung tâm resort, đống lửa được đốt lên lúc 20:00. Khoai nướng, bắp luộc, guitar dân ca và câu chuyện chia sẻ — đơn giản mà đáng nhớ.",
    price: 0,
    duration: 120,
    maxSlots: 30,
    included: ["Đống lửa", "Khoai nướng + bắp luộc", "Nước uống", "Đàn guitar"],
    notes: ["Diễn ra hằng đêm", "Mang theo ghế cắm trại nếu muốn", "Thú cưng được chào đón"],
    emoji: "🔥",
    gradient: "from-orange-950 via-red-900 to-rose-950",
    schedules: ["20:00"],
  },
  {
    slug: "dap-xe-kham-pha",
    name: "Đạp xe khám phá",
    category: "land",
    tagline: "Làng chài và đồng muối trong 2 giờ",
    description:
      "Đạp xe qua làng chài ven biển, ghé đồng muối Phù Cát và khu vườn thanh long địa phương. Tốc độ thư thái, dừng chụp ảnh thoải mái.",
    price: 150_000,
    duration: 120,
    maxSlots: 10,
    included: ["Xe đạp + mũ bảo hiểm", "Hướng dẫn viên", "Nước uống"],
    notes: ["Phù hợp mọi lứa tuổi", "Tuyến đường bằng phẳng", "Mang theo máy ảnh"],
    emoji: "🚴",
    gradient: "from-lime-900 via-green-800 to-emerald-900",
    schedules: ["06:00", "15:30"],
  },

  // ── WELLNESS ──────────────────────────────────────────
  {
    slug: "yoga-buoi-sang",
    name: "Yoga buổi sáng",
    category: "wellness",
    tagline: "Bắt đầu ngày mới trong tĩnh lặng",
    description:
      "Lớp yoga ngoài trời trên bãi cỏ sương sớm, hướng về phía mặt trời mọc. Giáo viên được chứng nhận quốc tế, thích nghi cho cả người mới và người có kinh nghiệm.",
    price: 150_000,
    duration: 60,
    maxSlots: 15,
    included: ["Thảm yoga", "Hướng dẫn viên chứng nhận", "Nước trái cây sau lớp"],
    notes: ["Trang phục thoải mái", "Ăn nhẹ ít nhất 30 phút trước", "Đến sớm 5 phút"],
    emoji: "🧘",
    gradient: "from-violet-950 via-purple-900 to-indigo-950",
    schedules: ["06:00", "07:00"],
  },
  {
    slug: "spa-tram-huong",
    name: "Spa Trầm Hương",
    category: "wellness",
    tagline: "Thư giãn toàn thân với tinh dầu trầm",
    description:
      "Liệu trình 90 phút với tinh dầu trầm hương nguyên chất Bình Định. Massage toàn thân, đắp mặt thảo dược và ngâm chân muối hồng. Phòng spa riêng, yên tĩnh tuyệt đối.",
    price: 500_000,
    duration: 90,
    maxSlots: 4,
    included: ["Tinh dầu trầm hương nguyên chất", "Massage toàn thân", "Đắp mặt thảo dược", "Ngâm chân muối hồng", "Trà thảo mộc"],
    notes: ["Đặt lịch trước ít nhất 4 giờ", "Không áp dụng cho phụ nữ có thai", "Mặc quần áo rộng rãi"],
    emoji: "💆",
    gradient: "from-rose-950 via-pink-900 to-fuchsia-950",
    schedules: ["09:00", "11:00", "14:00", "16:00"],
  },
  {
    slug: "thien-dinh-suoi",
    name: "Thiền định ven suối",
    category: "wellness",
    tagline: "Tĩnh tâm theo tiếng nước chảy",
    description:
      "Buổi thiền 45 phút ngay cạnh con suối tự nhiên chảy qua khu rừng resort. Hướng dẫn viên thiền định dẫn dắt, phù hợp người chưa từng thiền.",
    price: 0,
    duration: 45,
    maxSlots: 20,
    included: ["Đệm ngồi thiền", "Hướng dẫn viên", "Trà thảo mộc sau buổi"],
    notes: ["Tắt hoàn toàn điện thoại", "Mặc đồ ấm buổi sáng", "Không nói chuyện"],
    emoji: "🌊",
    gradient: "from-teal-950 via-cyan-900 to-sky-950",
    schedules: ["05:30", "17:30"],
  },

  // ── FOOD ──────────────────────────────────────────────
  {
    slug: "lam-banh-xeo",
    name: "Học làm bánh xèo",
    category: "food",
    tagline: "Bí quyết bánh xèo Bình Định từ đầu bếp địa phương",
    description:
      "Đầu bếp sinh ra và lớn lên ở Bình Định chia sẻ công thức gia truyền bánh xèo giòn. Tự tay xay bột, pha nước chấm và chiên — sau đó ăn ngay thành quả.",
    price: 300_000,
    duration: 120,
    maxSlots: 8,
    included: ["Nguyên liệu đầy đủ", "Đầu bếp hướng dẫn", "Tạp dề + mũ bếp", "Thưởng thức thành phẩm", "Công thức mang về"],
    notes: ["Không yêu cầu kinh nghiệm nấu ăn", "Phù hợp gia đình có trẻ em", "Mang giày kín"],
    emoji: "🥘",
    gradient: "from-amber-950 via-orange-900 to-yellow-950",
    schedules: ["09:00", "15:00"],
  },
  {
    slug: "thu-tra-tram",
    name: "Thưởng trà trầm hương",
    category: "food",
    tagline: "Nghệ thuật trà đạo giữa rừng trầm",
    description:
      "Buổi thưởng trà thư thái với bộ ấm sứ thủ công, trà xanh Bình Định ướp hương trầm. Chuyên gia trà dẫn dắt từng bước — từ pha, rót đến thưởng thức chánh niệm.",
    price: 100_000,
    duration: 60,
    maxSlots: 10,
    included: ["Bộ trà sứ", "Trà xanh ướp trầm", "Bánh dẻo truyền thống", "Chuyên gia trà"],
    notes: ["Không nói chuyện to", "Tắt điện thoại", "Ngồi trên sàn — mang gối nếu cần"],
    emoji: "🍵",
    gradient: "from-stone-900 via-amber-950 to-yellow-950",
    schedules: ["07:30", "16:00"],
  },
  {
    slug: "hai-san-tuoi",
    name: "Bàn tiệc hải sản tươi",
    category: "food",
    tagline: "Từ biển lên bàn trong vòng 4 giờ",
    description:
      "Mỗi tối thứ 6 và Chủ nhật, bếp resort bày bàn tiệc hải sản tươi sống trực tiếp từ thuyền của ngư dân địa phương. Tôm hùm, mực ống, cua gạch, cá thu nướng than.",
    price: 850_000,
    duration: 150,
    maxSlots: 20,
    included: ["Buffet hải sản tươi sống", "Nước ngọt không giới hạn", "Bánh mì nướng", "Salad rau sạch"],
    notes: ["Diễn ra thứ 6 & Chủ nhật", "Đặt chỗ trước 1 ngày", "Trẻ em dưới 5 tuổi: miễn phí"],
    emoji: "🦞",
    gradient: "from-red-950 via-orange-900 to-amber-950",
    schedules: ["19:00"],
  },
];
