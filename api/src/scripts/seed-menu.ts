import 'dotenv/config'
import { prisma } from '@tram-huong/database'

const MENU_ITEMS = [
  // ─── BREAKFAST ──────────────────────────────────────────
  {
    name: 'Bánh mì trứng ốp la', nameEn: 'Egg baguette', category: 'BREAKFAST',
    price: 45_000, isVeg: false, sortOrder: 1,
    description: 'Bánh mì giòn với trứng ốp la, chả chua và rau thơm Bình Định',
  },
  {
    name: 'Cháo trắng hải sản', nameEn: 'Seafood congee', category: 'BREAKFAST',
    price: 65_000, isVeg: false, sortOrder: 2,
    description: 'Cháo nấu từ gạo lứt, tôm cua tươi và hành phi giòn',
  },
  {
    name: 'Yến mạch granola trái cây', nameEn: 'Granola & fruits', category: 'BREAKFAST',
    price: 55_000, isVeg: true, sortOrder: 3,
    description: 'Granola giòn với sữa chua thuần chay, mật ong và trái cây nhiệt đới tươi',
  },
  {
    name: 'Phở bò Bình Định', nameEn: 'Binh Dinh beef pho', category: 'BREAKFAST',
    price: 75_000, isVeg: false, sortOrder: 4,
    description: 'Phở nấu từ xương bò hầm 12 tiếng, thịt bò tái thượng hạng, rau thơm địa phương',
  },

  // ─── LUNCH ──────────────────────────────────────────────
  {
    name: 'Cơm bình dân Bình Định', nameEn: 'Binh Dinh set lunch', category: 'LUNCH',
    price: 95_000, isVeg: false, sortOrder: 1,
    description: 'Cơm gạo lứt, thịt heo rim, canh chua cá tươi, rau luộc địa phương',
  },
  {
    name: 'Gỏi cá trích', nameEn: 'Sardine salad', category: 'LUNCH',
    price: 85_000, isVeg: false, sortOrder: 2,
    description: 'Đặc sản Bình Định — cá trích tươi, xoài xanh, đậu phộng rang, rau thơm',
  },
  {
    name: 'Bún chả cá', nameEn: 'Fish cake noodles', category: 'LUNCH',
    price: 70_000, isVeg: false, sortOrder: 3,
    description: 'Bún với chả cá thu truyền thống, nước dùng ngọt từ xương heo',
  },
  {
    name: 'Cơm cuộn rau củ chay', nameEn: 'Veggie rice roll', category: 'LUNCH',
    price: 80_000, isVeg: true, sortOrder: 4,
    description: 'Cơm Nhật cuộn với rau củ organic từ vườn resort, tương miso tự làm',
  },
  {
    name: 'Bánh xèo miền Trung', nameEn: 'Central sizzling crepe', category: 'LUNCH',
    price: 90_000, isVeg: false, sortOrder: 5,
    description: 'Bánh xèo giòn nhân tôm thịt, giá đỗ, cuốn với rau sống và nước chấm đặc biệt',
  },

  // ─── DINNER ─────────────────────────────────────────────
  {
    name: 'Lẩu mắm Bình Định', nameEn: 'Binh Dinh fermented fish hotpot', category: 'DINNER',
    price: 280_000, isVeg: false, sortOrder: 1,
    description: 'Lẩu mắm đặc trưng miền Trung, hải sản tươi ngày, rau sống nhiều loại. Dành cho 2 người.',
  },
  {
    name: 'Gà nướng mật ong sả chanh', nameEn: 'Honey lemongrass grilled chicken', category: 'DINNER',
    price: 195_000, isVeg: false, sortOrder: 2,
    description: 'Gà thả vườn nướng than hoa, ướp mật ong + sả chanh + tỏi, ăn kèm cơm trắng',
  },
  {
    name: 'Tôm hùm nướng bơ tỏi', nameEn: 'Butter garlic grilled lobster', category: 'DINNER',
    price: 480_000, isVeg: false, sortOrder: 3,
    description: 'Tôm hùm Bình Định tươi sống nướng bơ tỏi thơm lừng. Giá theo kg tôm trong ngày.',
  },
  {
    name: 'Cá bớp hấp gừng', nameEn: 'Steamed grouper with ginger', category: 'DINNER',
    price: 320_000, isVeg: false, sortOrder: 4,
    description: 'Cá bớp tươi từ biển Quy Nhơn hấp gừng sả, nước sốt thanh đạm',
  },
  {
    name: 'Rau củ nướng lò đất', nameEn: 'Clay oven roasted vegetables', category: 'DINNER',
    price: 120_000, isVeg: true, sortOrder: 5,
    description: 'Rau củ organic từ vườn resort nướng lò đất với dầu thảo mộc và muối biển',
  },

  // ─── DRINKS ─────────────────────────────────────────────
  {
    name: 'Nước dừa tươi', nameEn: 'Fresh coconut water', category: 'DRINKS',
    price: 35_000, isVeg: true, sortOrder: 1,
    description: 'Dừa tươi đặt từ vườn địa phương, mát lạnh',
  },
  {
    name: 'Sinh tố xoài cát Hòa Lộc', nameEn: 'Hoa Loc mango smoothie', category: 'DRINKS',
    price: 55_000, isVeg: true, sortOrder: 2,
    description: 'Xoài cát Hòa Lộc tươi xay với sữa tươi không đường, ngọt tự nhiên',
  },
  {
    name: 'Trà hoa đung đưa', nameEn: 'Wildflower herbal tea', category: 'DRINKS',
    price: 45_000, isVeg: true, sortOrder: 3,
    description: 'Pha từ hoa cúc, lavender, bạc hà và mật ong rừng. Phục vụ nóng hoặc đá.',
  },
  {
    name: 'Cà phê Arabica Kon Tum', nameEn: 'Kon Tum Arabica coffee', category: 'DRINKS',
    price: 50_000, isVeg: true, sortOrder: 4,
    description: 'Cà phê Arabica rang xay tươi từ Kon Tum, pha phin truyền thống. Đen hoặc sữa.',
  },

  // ─── SNACKS ─────────────────────────────────────────────
  {
    name: 'Bánh tráng trộn Quy Nhơn', nameEn: 'Quy Nhon rice paper salad', category: 'SNACKS',
    price: 40_000, isVeg: true, sortOrder: 1,
    description: 'Bánh tráng cắt nhỏ trộn xoài, trứng cút, khô bò, tắc và sa tế',
  },
  {
    name: 'Chè đậu xanh dừa', nameEn: 'Mung bean coconut dessert', category: 'SNACKS',
    price: 45_000, isVeg: true, sortOrder: 2,
    description: 'Chè đậu xanh thơm mịn với nước cốt dừa, đường phèn, phục vụ nóng hoặc lạnh',
  },
  {
    name: 'Trái cây nhiệt đới cắt miếng', nameEn: 'Tropical fruit platter', category: 'SNACKS',
    price: 65_000, isVeg: true, sortOrder: 3,
    description: 'Đĩa trái cây theo mùa: xoài, thanh long, ổi, đu đủ và dứa từ vườn địa phương',
  },
]

async function main() {
  console.log('Seeding menu items...')
  let count = 0
  for (const item of MENU_ITEMS) {
    const existing = await prisma.menuItem.findFirst({ where: { name: item.name } })
    if (existing) {
      console.log(`  skip: ${item.name} (already exists)`)
      continue
    }
    await prisma.menuItem.create({ data: item })
    console.log(`  +  ${item.category} | ${item.name}`)
    count++
  }
  console.log(`\nDone! Seeded ${count} new menu items.`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
