export type ResortPackage = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  roomSlug: string;       // phòng đi kèm
  nights: number;
  includes: string[];     // những gì bao gồm
  originalPrice: number;  // giá nếu mua lẻ
  packagePrice: number;   // giá gói (đã giảm)
  badge?: string;
  gradient: string;
  emoji: string;
  image: string;
};

export const PACKAGES: ResortPackage[] = [
  {
    slug: "romantic-couple",
    name: "Gói Lãng Mạn",
    tagline: "2 ngày 1 đêm cho cặp đôi",
    description:
      "Trốn khỏi thế giới cùng người thương. Bungalow view biển riêng tư, bữa tối lãng mạn bên bờ biển dưới ánh nến, và liệu trình spa đôi thư giãn.",
    roomSlug: "bungalow-bien",
    nights: 1,
    includes: [
      "1 đêm Bungalow View Biển",
      "Bữa tối lãng mạn bên biển (2 người)",
      "Spa đôi 60 phút",
      "Bữa sáng buffet",
      "Trang trí phòng hoa hồng + champagne",
    ],
    originalPrice: 5_500_000,
    packagePrice: 4_600_000,
    badge: "Bán chạy nhất",
    gradient: "from-rose-900 via-pink-800 to-red-900",
    emoji: "💑",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=85",
  },
  {
    slug: "family-adventure",
    name: "Gói Gia Đình",
    tagline: "3 ngày 2 đêm cho cả nhà",
    description:
      "Kỳ nghỉ trọn vẹn cho gia đình. Villa rộng rãi với hồ bơi riêng, các hoạt động Eco Challenge cho trẻ, chèo SUP và đêm lửa trại đáng nhớ.",
    roomSlug: "villa-gia-dinh",
    nights: 2,
    includes: [
      "2 đêm Villa Gia Đình (hồ bơi riêng)",
      "Chèo SUP & Kayak cho cả nhà",
      "Đêm lửa trại + BBQ hải sản",
      "Eco Challenge cho trẻ em",
      "Bữa sáng buffet mỗi ngày",
    ],
    originalPrice: 18_000_000,
    packagePrice: 15_000_000,
    badge: "Tiết kiệm 3 triệu",
    gradient: "from-amber-900 via-orange-800 to-yellow-900",
    emoji: "👨‍👩‍👧‍👦",
    image: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=85",
  },
  {
    slug: "wellness-retreat",
    name: "Gói Tịnh Dưỡng",
    tagline: "3 ngày 2 đêm chữa lành",
    description:
      "Tái tạo năng lượng giữa thiên nhiên. Nhà sàn rừng yên tĩnh, yoga bình minh, thiền định ven suối và liệu trình spa trầm hương độc quyền.",
    roomSlug: "nha-san-rung",
    nights: 2,
    includes: [
      "2 đêm Nhà Sàn Rừng",
      "Yoga bình minh mỗi sáng",
      "Spa trầm hương 90 phút",
      "Thiền định ven suối",
      "Thực đơn healthy + trà thảo mộc",
    ],
    originalPrice: 9_600_000,
    packagePrice: 7_900_000,
    gradient: "from-emerald-950 via-green-900 to-teal-900",
    emoji: "🧘",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&q=85",
  },
];

export function formatPackagePrice(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}
