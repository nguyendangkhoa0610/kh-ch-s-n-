import { Hono } from 'hono'
import { prisma } from '@tram-huong/database'

export const roomsRouter = new Hono()

// GET /api/rooms - danh sách phòng
roomsRouter.get('/', async (c) => {
  const rooms = await prisma.room.findMany({
    include: { roomType: true },
    orderBy: { number: 'asc' },
  })
  return c.json({ data: rooms })
})

// GET /api/rooms/types - loại phòng
roomsRouter.get('/types', async (c) => {
  const roomTypes = await prisma.roomType.findMany({
    include: { _count: { select: { rooms: true } } },
  })
  return c.json({ data: roomTypes })
})

// GET /api/rooms/:id
roomsRouter.get('/:id', async (c) => {
  const id = c.req.param('id')
  const room = await prisma.room.findUnique({
    where: { id },
    include: { roomType: true },
  })
  if (!room) return c.json({ error: 'Phòng không tồn tại' }, 404)
  return c.json({ data: room })
})

// PATCH /api/rooms/types/:id — cập nhật thông tin loại phòng
roomsRouter.patch('/types/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{
    name?: string; tagline?: string; description?: string
    basePrice?: number; capacity?: number; size?: number
    bedType?: string; view?: string; badge?: string | null
    amenities?: string[]; images?: string[]
  }>()
  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name
  if (body.tagline !== undefined) data.tagline = body.tagline
  if (body.description !== undefined) data.description = body.description
  if (body.basePrice !== undefined) data.basePrice = Number(body.basePrice)
  if (body.capacity !== undefined) data.capacity = Number(body.capacity)
  if (body.size !== undefined) data.size = Number(body.size)
  if (body.bedType !== undefined) data.bedType = body.bedType
  if (body.view !== undefined) data.view = body.view
  if ('badge' in body) data.badge = body.badge ?? null
  if (body.amenities !== undefined) data.amenities = JSON.stringify(body.amenities)
  if (body.images !== undefined) data.images = JSON.stringify(body.images)

  const roomType = await prisma.roomType.update({ where: { id }, data })
  return c.json({ data: roomType })
})

// POST /api/rooms — thêm phòng mới
roomsRouter.post('/', async (c) => {
  const body = await c.req.json<{
    number: string; floor: number; roomTypeId: string; status?: string
  }>()
  if (!body.number || !body.roomTypeId) {
    return c.json({ error: 'Thiếu số phòng hoặc loại phòng' }, 400)
  }
  const existing = await prisma.room.findUnique({ where: { number: body.number } })
  if (existing) return c.json({ error: `Phòng ${body.number} đã tồn tại` }, 409)

  const room = await prisma.room.create({
    data: {
      number: body.number,
      floor: body.floor ?? 1,
      roomTypeId: body.roomTypeId,
      status: (body.status as 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE') ?? 'AVAILABLE',
    },
    include: { roomType: true },
  })
  return c.json({ data: room }, 201)
})

// DELETE /api/rooms/:id — xóa phòng
roomsRouter.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const room = await prisma.room.findUnique({ where: { id } })
  if (!room) return c.json({ error: 'Phòng không tồn tại' }, 404)

  const activeBooking = await prisma.booking.findFirst({
    where: { roomId: id, status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] } },
  })
  if (activeBooking) {
    return c.json({ error: 'Phòng đang có booking đang hoạt động, không thể xóa' }, 409)
  }

  await prisma.room.delete({ where: { id } })
  return c.json({ success: true })
})

// GET /api/rooms/availability?slug=bungalow-bien&month=2026-06
// Trả về mảng ngày đã có booking trong tháng (YYYY-MM-DD)
roomsRouter.get('/availability', async (c) => {
  const slug = c.req.query('slug')
  const month = c.req.query('month') // YYYY-MM

  if (!slug || !month) return c.json({ error: 'Thiếu slug hoặc month' }, 400)
  if (!/^\d{4}-\d{2}$/.test(month)) return c.json({ error: 'month phải có dạng YYYY-MM' }, 400)

  const [year, m] = month.split('-').map(Number)
  const monthStart = new Date(year!, m! - 1, 1)
  const monthEnd = new Date(year!, m!, 0, 23, 59, 59)

  // Lấy tất cả bookings active trong tháng cho room type này
  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
      room: { roomType: { slug } },
      OR: [
        { checkIn: { gte: monthStart, lte: monthEnd } },
        { checkOut: { gte: monthStart, lte: monthEnd } },
        { checkIn: { lte: monthStart }, checkOut: { gte: monthEnd } },
      ],
    },
    select: { checkIn: true, checkOut: true },
  })

  // Tổng số phòng của loại này
  const totalRooms = await prisma.room.count({ where: { roomType: { slug }, status: { not: 'MAINTENANCE' } } })

  // Tạo map: ngày → số phòng đã đặt
  const bookedMap: Record<string, number> = {}
  for (const b of bookings) {
    const cur = new Date(b.checkIn)
    const end = new Date(b.checkOut)
    while (cur < end) {
      const key = cur.toISOString().split('T')[0]!
      bookedMap[key] = (bookedMap[key] ?? 0) + 1
      cur.setDate(cur.getDate() + 1)
    }
  }

  // Ngày nào đã đầy (booked >= totalRooms) → unavailable
  const unavailable: string[] = []
  const daysInMonth = new Date(year!, m!, 0).getDate()
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    if ((bookedMap[key] ?? 0) >= totalRooms) unavailable.push(key)
  }

  return c.json({ data: { slug, month, totalRooms, unavailable } })
})

// PATCH /api/rooms/:id/status
roomsRouter.patch('/:id/status', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{ status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' }>()
  const room = await prisma.room.update({
    where: { id },
    data: { status: body.status },
  })
  return c.json({ data: room })
})
