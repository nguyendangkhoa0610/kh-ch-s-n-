import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const FULL_ROOM_TYPES = [
  {
    slug: 'bungalow-bien',
    tagline: 'Thức giấc cùng bình minh trên vịnh',
    description: 'Bungalow đơn tầng ngay sát bãi biển với ban công rộng nhìn thẳng ra vịnh. Buổi sáng uống cà phê nhìn mặt trời mọc, buổi chiều ngồi võng nghe sóng — không gian riêng tư hoàn toàn.',
    basePrice: 3_800_000,
    capacity: 2,
    size: 45,
    bedType: 'Giường King',
    view: 'Vịnh biển',
    amenities: JSON.stringify(['Hồ bơi riêng', 'Ban công view biển', 'Minibar', 'WiFi miễn phí', 'Máy lạnh', 'TV 55"', 'Két sắt', 'Máy pha cà phê']),
    images: JSON.stringify(['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=85', 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80', 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80']),
    badge: 'Phổ biến nhất',
  },
  {
    slug: 'nha-san-rung',
    tagline: 'Trên cao giữa tán cây trầm hương',
    description: 'Nhà sàn gỗ tự nhiên nằm giữa rừng trầm, cao hơn mặt đất 2 mét. Thức giấc với tiếng chim, ngủ với tiếng gió lướt qua tán cây. Phòng tắm ngoài trời với vòi hoa sen ngắm rừng.',
    basePrice: 2_800_000,
    capacity: 2,
    size: 38,
    bedType: 'Giường Queen',
    view: 'Rừng trầm hương',
    amenities: JSON.stringify(['Sàn gỗ tự nhiên', 'Võng rừng', 'Vòi sen ngoài trời', 'WiFi miễn phí', 'Quạt trần', 'Minibar', 'Ấm đun nước']),
    images: JSON.stringify(['https://images.unsplash.com/photo-1618767689160-da3fb810aad5?w=1200&q=85', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80', 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=800&q=80']),
    badge: null,
  },
  {
    slug: 'villa-gia-dinh',
    tagline: 'Không gian riêng tư cho cả gia đình',
    description: 'Villa 2 phòng ngủ với hồ bơi riêng và sân vườn, phù hợp cho gia đình 4-6 người. Bếp nhỏ để tự nấu bữa sáng, khu vui chơi ngoài trời và BBQ cuối ngày.',
    basePrice: 7_500_000,
    capacity: 6,
    size: 120,
    bedType: '2 phòng (King + Twin)',
    view: 'Vườn & hồ bơi riêng',
    amenities: JSON.stringify(['2 phòng ngủ', 'Hồ bơi riêng', 'Bếp nhỏ', 'Sân vườn', 'WiFi miễn phí', '2 phòng tắm', 'Máy giặt', 'BBQ ngoài trời']),
    images: JSON.stringify(['https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=85', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80']),
    badge: 'Cho gia đình',
  },
  {
    slug: 'eco-pod',
    tagline: 'Ngủ dưới bầu trời triệu ngôi sao',
    description: 'Pod hình tròn với mái kính trong suốt — thiết kế độc bản tại Việt Nam. Ban đêm tắt đèn, nhìn thẳng lên dải ngân hà. Bồn tắm ngoài trời nhúng sao trời.',
    basePrice: 4_500_000,
    capacity: 2,
    size: 28,
    bedType: 'Giường tròn (đặc biệt)',
    view: 'Bầu trời sao',
    amenities: JSON.stringify(['Mái kính nhìn sao', 'Giường tròn', 'Bồn tắm ngoài trời', 'WiFi miễn phí', 'Máy lạnh', 'Minibar']),
    images: JSON.stringify(['https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=1200&q=85', 'https://images.unsplash.com/photo-1629236714003-1e62c7f5f44d?w=800&q=80', 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80']),
    badge: 'Độc đáo nhất',
  },
  {
    slug: 'leu-dong-co',
    tagline: 'Glamping đích thực giữa thiên nhiên',
    description: 'Lều vải canvas cao cấp trên nền gỗ cứng, giữa đồng cỏ xanh mướt. Đơn giản, mộc mạc nhưng đầy đủ tiện nghi cơ bản. Trải nghiệm sống gần thiên nhiên nhất mà vẫn có giường êm.',
    basePrice: 1_600_000,
    capacity: 2,
    size: 22,
    bedType: 'Giường Queen',
    view: 'Đồng cỏ & đồi núi',
    amenities: JSON.stringify(['Giường đôi', 'Quạt điện', 'WiFi miễn phí', 'Đèn cắm trại', 'Bàn ngoài trời']),
    images: JSON.stringify(['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&q=85', 'https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?w=800&q=80', 'https://images.unsplash.com/photo-1581335167019-3d1e02021f49?w=800&q=80']),
    badge: null,
  },
  {
    slug: 'suite-tram-huong',
    tagline: 'Đỉnh cao nghỉ dưỡng — trầm hương toàn diện',
    description: 'Suite cao cấp nhất resort với nội thất gỗ trầm hương thủ công, hồ bơi infinity riêng và butler service 24/7. Bao gồm một liệu trình spa mỗi ngày và đưa đón sân bay Phù Cát.',
    basePrice: 12_000_000,
    capacity: 4,
    size: 180,
    bedType: 'King size đặc biệt',
    view: 'Toàn cảnh resort & biển',
    amenities: JSON.stringify(['Butler service 24/7', 'Hồ bơi infinity riêng', 'Bồn tắm sục', 'Phòng khách riêng', 'WiFi miễn phí', 'Minibar premium', 'Đưa đón sân bay', 'Spa 1 lần/ngày']),
    images: JSON.stringify(['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=85', 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80', 'https://images.unsplash.com/photo-1590381105924-c72589b81ef1?w=800&q=80']),
    badge: 'Luxury',
  },
]

async function main() {
  console.log('Cập nhật room types...')
  for (const rt of FULL_ROOM_TYPES) {
    await prisma.roomType.update({
      where: { slug: rt.slug },
      data: rt,
    })
    console.log(`✓ ${rt.name}`)
  }
  console.log('Xong!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
