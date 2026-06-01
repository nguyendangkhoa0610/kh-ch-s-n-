import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const ROOM_TYPES = [
  {
    slug: 'bungalow-bien',
    name: 'Bungalow View Biển',
    description: 'Bungalow đơn tầng ngay sát bãi biển với ban công rộng nhìn thẳng ra vịnh.',
    basePrice: 3_800_000,
    capacity: 2,
    size: 45,
    rooms: ['B01', 'B02', 'B03'],
  },
  {
    slug: 'nha-san-rung',
    name: 'Nhà Sàn Rừng',
    description: 'Nhà sàn gỗ tự nhiên nằm giữa rừng trầm, cao hơn mặt đất 2 mét.',
    basePrice: 2_800_000,
    capacity: 2,
    size: 38,
    rooms: ['S01', 'S02', 'S03'],
  },
  {
    slug: 'villa-gia-dinh',
    name: 'Villa Gia Đình',
    description: 'Villa 2 phòng ngủ với hồ bơi riêng và sân vườn, phù hợp cho gia đình.',
    basePrice: 7_500_000,
    capacity: 6,
    size: 120,
    rooms: ['V01', 'V02'],
  },
  {
    slug: 'eco-pod',
    name: 'Eco Pod',
    description: 'Pod hình tròn với mái kính trong suốt — nhìn thẳng lên bầu trời sao đêm.',
    basePrice: 4_500_000,
    capacity: 2,
    size: 28,
    rooms: ['P01', 'P02', 'P03', 'P04'],
  },
  {
    slug: 'leu-dong-co',
    name: 'Lều Đồng Cỏ',
    description: 'Lều vải canvas cao cấp trên nền gỗ cứng, giữa đồng cỏ xanh mướt.',
    basePrice: 1_600_000,
    capacity: 2,
    size: 22,
    rooms: ['L01', 'L02', 'L03', 'L04', 'L05'],
  },
  {
    slug: 'suite-tram-huong',
    name: 'Suite Trầm Hương',
    description: 'Suite cao cấp nhất resort với nội thất gỗ trầm hương thủ công.',
    basePrice: 12_000_000,
    capacity: 4,
    size: 180,
    rooms: ['TH01'],
  },
]

const ACTIVITIES = [
  { slug: 'sup-kayak', name: 'Chèo SUP & Kayak', price: 250_000, duration: 90, maxSlots: 8, category: 'water' },
  { slug: 'lan-snorkeling', name: 'Lặn snorkeling', price: 350_000, duration: 120, maxSlots: 6, category: 'water' },
  { slug: 'danh-ca-dem', name: 'Đánh cá đêm', price: 500_000, duration: 180, maxSlots: 10, category: 'water' },
  { slug: 'trek-rung-tram', name: 'Trekking rừng trầm', price: 350_000, duration: 180, maxSlots: 12, category: 'land' },
  { slug: 'dot-lua-trai', name: 'Đốt lửa trại', price: 0, duration: 120, maxSlots: 30, category: 'land' },
  { slug: 'dap-xe-kham-pha', name: 'Đạp xe khám phá', price: 150_000, duration: 120, maxSlots: 10, category: 'land' },
  { slug: 'yoga-buoi-sang', name: 'Yoga buổi sáng', price: 150_000, duration: 60, maxSlots: 15, category: 'wellness' },
  { slug: 'spa-tram-huong', name: 'Spa Trầm Hương', price: 500_000, duration: 90, maxSlots: 4, category: 'wellness' },
  { slug: 'thien-dinh-suoi', name: 'Thiền định ven suối', price: 0, duration: 45, maxSlots: 20, category: 'wellness' },
  { slug: 'lam-banh-xeo', name: 'Học làm bánh xèo', price: 300_000, duration: 120, maxSlots: 8, category: 'food' },
  { slug: 'thu-tra-tram', name: 'Thưởng trà trầm hương', price: 100_000, duration: 60, maxSlots: 10, category: 'food' },
  { slug: 'hai-san-tuoi', name: 'Bàn tiệc hải sản tươi', price: 850_000, duration: 150, maxSlots: 20, category: 'food' },
]

const STAFF = [
  { email: 'lectan@tramhuong.vn', name: 'Lê Văn Tân', role: 'STAFF', area: 'reception' },
  { email: 'nguyenmai@tramhuong.vn', name: 'Nguyễn Thị Mai', role: 'STAFF', area: 'beach' },
  { email: 'tranduong@tramhuong.vn', name: 'Trần Đức Dương', role: 'STAFF', area: 'kitchen' },
  { email: 'hoanglan@tramhuong.vn', name: 'Hoàng Thị Lan', role: 'STAFF', area: 'housekeeping' },
  { email: 'manager@tramhuong.vn', name: 'Phạm Quốc Hùng', role: 'MANAGER', area: 'all' },
]

async function main() {
  console.log('Seeding database...')

  // Admin user (password: Admin@2026)
  const passwordHash = await bcrypt.hash('Admin@2026', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tramhuong.vn' },
    update: { passwordHash },
    create: {
      email: 'admin@tramhuong.vn',
      name: 'Admin Trầm Hương',
      role: 'ADMIN',
      passwordHash,
    },
  })

  // Staff users (password: TramHuong@2026)
  const staffHash = await bcrypt.hash('TramHuong@2026', 10)
  const staffUsers: { id: string; area: string }[] = []
  for (const s of STAFF) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: { passwordHash: staffHash },
      create: { email: s.email, name: s.name, role: s.role, passwordHash: staffHash },
    })
    staffUsers.push({ id: user.id, area: s.area })
  }

  // Seed ca trực hôm nay cho staff
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const shiftAreas = ['reception', 'beach', 'kitchen', 'housekeeping', 'all']
  for (let i = 0; i < staffUsers.length; i++) {
    const start = new Date(today)
    start.setHours(i % 2 === 0 ? 7 : 15)
    const end = new Date(start)
    end.setHours(start.getHours() + 8)
    await prisma.shift.upsert({
      where: { id: `seed-shift-${staffUsers[i].id}` },
      update: { startTime: start, endTime: end },
      create: {
        id: `seed-shift-${staffUsers[i].id}`,
        staffId: staffUsers[i].id,
        startTime: start,
        endTime: end,
        area: shiftAreas[i] ?? 'all',
        notes: 'Ca hôm nay',
      },
    }).catch(() => {
      // Shift may already exist with different id
    })
  }

  // Seed messages
  const allStaffIds = staffUsers.map((s) => s.id)
  if (allStaffIds.length > 0) {
    const seedMessages = [
      { team: 'all', content: 'Chào buổi sáng team! Hôm nay có đoàn 15 khách check-in lúc 14:00' },
      { team: 'reception', content: 'Phòng B02 đặt thêm breakfast cho ngày mai nhé' },
      { team: 'beach', content: 'SUP equipment đã được kiểm tra, sẵn sàng cho buổi chiều' },
      { team: 'housekeeping', content: 'Phòng V01 yêu cầu dọn dẹp trước 11:00 sáng' },
    ]
    for (let i = 0; i < seedMessages.length; i++) {
      await prisma.message.create({
        data: {
          senderId: allStaffIds[i % allStaffIds.length],
          team: seedMessages[i].team,
          content: seedMessages[i].content,
        },
      }).catch(() => {}) // ignore duplicate
    }
  }

  // Room types + rooms
  for (const rt of ROOM_TYPES) {
    const { rooms, ...rtData } = rt
    const roomType = await prisma.roomType.upsert({
      where: { slug: rtData.slug },
      update: { basePrice: rtData.basePrice },
      create: {
        ...rtData,
        amenities: '[]',
        images: '[]',
      },
    })

    for (const number of rooms) {
      await prisma.room.upsert({
        where: { number },
        update: {},
        create: { number, roomTypeId: roomType.id, floor: 1 },
      })
    }
  }

  // Activities
  for (const act of ACTIVITIES) {
    await prisma.activity.upsert({
      where: { slug: act.slug },
      update: {},
      create: { ...act, description: act.name, images: '[]' },
    })
  }

  console.log('Seed hoàn tất!', { admin: admin.email, staffCount: staffUsers.length })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => {
    void prisma.$disconnect()
  })
