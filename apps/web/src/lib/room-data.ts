import { formatPrice } from "@tram-huong/shared";

export type RoomType = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  capacity: number;
  size: number;
  bedType: string;
  view: string;
  amenities: string[];
  gradient: string;
  badge?: string;
};

export const ROOM_TYPES: RoomType[] = [
  {
    slug: "bungalow-bien",
    name: "Bungalow View Biển",
    tagline: "Thức giấc cùng bình minh trên vịnh",
    description:
      "Bungalow đơn tầng ngay sát bãi biển với ban công rộng nhìn thẳng ra vịnh. Buổi sáng uống cà phê nhìn mặt trời mọc, buổi chiều ngồi võng nghe sóng — không gian riêng tư hoàn toàn.",
    price: 3_800_000,
    capacity: 2,
    size: 45,
    bedType: "Giường King",
    view: "Vịnh biển",
    amenities: [
      "Hồ bơi riêng",
      "Ban công view biển",
      "Minibar",
      "WiFi miễn phí",
      "Máy lạnh",
      "TV 55\"",
      "Két sắt",
      "Máy pha cà phê",
    ],
    gradient: "from-cyan-900 via-teal-800 to-emerald-900",
    badge: "Phổ biến nhất",
  },
  {
    slug: "nha-san-rung",
    name: "Nhà Sàn Rừng",
    tagline: "Trên cao giữa tán cây trầm hương",
    description:
      "Nhà sàn gỗ tự nhiên nằm giữa rừng trầm, cao hơn mặt đất 2 mét. Thức giấc với tiếng chim, ngủ với tiếng gió lướt qua tán cây. Phòng tắm ngoài trời với vòi hoa sen ngắm rừng.",
    price: 2_800_000,
    capacity: 2,
    size: 38,
    bedType: "Giường Queen",
    view: "Rừng trầm hương",
    amenities: [
      "Sàn gỗ tự nhiên",
      "Võng rừng",
      "Vòi sen ngoài trời",
      "WiFi miễn phí",
      "Quạt trần",
      "Minibar",
      "Ấm đun nước",
    ],
    gradient: "from-emerald-950 via-green-900 to-lime-950",
  },
  {
    slug: "villa-gia-dinh",
    name: "Villa Gia Đình",
    tagline: "Không gian riêng tư cho cả gia đình",
    description:
      "Villa 2 phòng ngủ với hồ bơi riêng và sân vườn, phù hợp cho gia đình 4-6 người. Bếp nhỏ để tự nấu bữa sáng, khu vui chơi ngoài trời và BBQ cuối ngày.",
    price: 7_500_000,
    capacity: 6,
    size: 120,
    bedType: "2 phòng (King + Twin)",
    view: "Vườn & hồ bơi riêng",
    amenities: [
      "2 phòng ngủ",
      "Hồ bơi riêng",
      "Bếp nhỏ",
      "Sân vườn",
      "WiFi miễn phí",
      "2 phòng tắm",
      "Máy giặt",
      "BBQ ngoài trời",
    ],
    gradient: "from-amber-950 via-orange-900 to-red-950",
    badge: "Cho gia đình",
  },
  {
    slug: "eco-pod",
    name: "Eco Pod",
    tagline: "Ngủ dưới bầu trời triệu ngôi sao",
    description:
      "Pod hình tròn với mái kính trong suốt — thiết kế độc bản tại Việt Nam. Ban đêm tắt đèn, nhìn thẳng lên dải ngân hà. Bồn tắm ngoài trời nhúng sao trời.",
    price: 4_500_000,
    capacity: 2,
    size: 28,
    bedType: "Giường tròn (đặc biệt)",
    view: "Bầu trời sao",
    amenities: [
      "Mái kính nhìn sao",
      "Giường tròn",
      "Bồn tắm ngoài trời",
      "WiFi miễn phí",
      "Máy lạnh",
      "Minibar",
    ],
    gradient: "from-indigo-950 via-violet-900 to-slate-900",
    badge: "Độc đáo nhất",
  },
  {
    slug: "leu-dong-co",
    name: "Lều Đồng Cỏ",
    tagline: "Glamping đích thực giữa thiên nhiên",
    description:
      "Lều vải canvas cao cấp trên nền gỗ cứng, giữa đồng cỏ xanh mướt. Đơn giản, mộc mạc nhưng đầy đủ tiện nghi cơ bản. Trải nghiệm sống gần thiên nhiên nhất mà vẫn có giường êm.",
    price: 1_600_000,
    capacity: 2,
    size: 22,
    bedType: "Giường Queen",
    view: "Đồng cỏ & đồi núi",
    amenities: [
      "Giường đôi",
      "Quạt điện",
      "WiFi miễn phí",
      "Đèn cắm trại",
      "Bàn ngoài trời",
    ],
    gradient: "from-lime-900 via-green-800 to-teal-900",
  },
  {
    slug: "suite-tram-huong",
    name: "Suite Trầm Hương",
    tagline: "Đỉnh cao nghỉ dưỡng — trầm hương toàn diện",
    description:
      "Suite cao cấp nhất resort với nội thất gỗ trầm hương thủ công, hồ bơi infinity riêng và butler service 24/7. Bao gồm một liệu trình spa mỗi ngày và đưa đón sân bay Phù Cát.",
    price: 12_000_000,
    capacity: 4,
    size: 180,
    bedType: "King size đặc biệt",
    view: "Toàn cảnh resort & biển",
    amenities: [
      "Butler service 24/7",
      "Hồ bơi infinity riêng",
      "Bồn tắm sục",
      "Phòng khách riêng",
      "WiFi miễn phí",
      "Minibar premium",
      "Đưa đón sân bay",
      "Spa 1 lần/ngày",
    ],
    gradient: "from-stone-900 via-amber-950 to-yellow-950",
    badge: "Luxury",
  },
];

export { formatPrice };
