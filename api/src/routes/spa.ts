import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { prisma } from '@tram-huong/database'

export const spaRouter = new Hono()

const JWT_SECRET = process.env['AUTH_SECRET'] ?? 'local-dev-secret'

const SPA_SERVICES = [
  { id: 'MASSAGE_TRAM_HUONG', name: 'Massage Trầm Hương', duration: 90, price: 850_000, description: 'Liệu pháp đặc trưng với tinh dầu trầm hương Bình Định', image: null },
  { id: 'FACIAL', name: 'Facial Thảo Mộc', duration: 60, price: 650_000, description: 'Chăm sóc da mặt bằng thảo mộc địa phương', image: null },
  { id: 'COUPLE_SPA', name: 'Couple Spa', duration: 120, price: 1_500_000, description: 'Trải nghiệm spa đôi trong phòng riêng', image: null },
  { id: 'SAUNA', name: 'Sauna & Steam', duration: 60, price: 0, description: 'Miễn phí cho khách lưu trú', image: null },
]

const TIME_SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '19:00', '20:00']

async function getGuestBookingId(authHeader: string | undefined): Promise<{ sub: string; bookingId: string } | null> {
  if (!authHeader?.startsWith('Bearer ')) return null
  try {
    const p = await verify(authHeader.slice(7), JWT_SECRET, 'HS256')
    return { sub: p['sub'] as string, bookingId: p['bookingId'] as string }
  } catch { return null }
}

async function getAdminId(authHeader: string | undefined): Promise<{ sub: string; role: string } | null> {
  if (!authHeader?.startsWith('Bearer ')) return null
  try {
    const p = await verify(authHeader.slice(7), JWT_SECRET, 'HS256')
    const role = p['role'] as string
    if (!['ADMIN', 'MANAGER', 'STAFF'].includes(role)) return null
    return { sub: p['sub'] as string, role }
  } catch { return null }
}

// GET /api/spa/services
spaRouter.get('/services', (c) => {
  return c.json({ data: SPA_SERVICES })
})

// GET /api/spa/availability?date=2026-06-07&service=MASSAGE_TRAM_HUONG
spaRouter.get('/availability', async (c) => {
  const date = c.req.query('date')
  const service = c.req.query('service')
  if (!date || !service) return c.json({ error: 'Cần có date và service' }, 400)

  const booked = await prisma.spaBooking.findMany({
    where: {
      date,
      service,
      status: { notIn: ['CANCELLED'] },
    },
    select: { timeSlot: true },
  })
  const bookedSlots = booked.map(b => b.timeSlot)
  const available = TIME_SLOTS.filter(t => !bookedSlots.includes(t))

  return c.json({ data: { date, service, available, allSlots: TIME_SLOTS } })
})

// POST /api/spa/book — guest đặt spa
spaRouter.post('/book', async (c) => {
  const auth = await getGuestBookingId(c.req.header('Authorization'))
  if (!auth) return c.json({ error: 'Chưa đăng nhập' }, 401)

  const body = await c.req.json<{
    service: string; date: string; timeSlot: string; guests?: number; notes?: string
  }>()

  if (!body.service || !body.date || !body.timeSlot) {
    return c.json({ error: 'Thiếu thông tin đặt lịch' }, 400)
  }

  const svc = SPA_SERVICES.find(s => s.id === body.service)
  if (!svc) return c.json({ error: 'Dịch vụ không tồn tại' }, 400)

  // Kiểm tra slot còn trống
  const conflict = await prisma.spaBooking.findFirst({
    where: {
      date: body.date,
      service: body.service,
      timeSlot: body.timeSlot,
      status: { notIn: ['CANCELLED'] },
    },
  })
  if (conflict) return c.json({ error: 'Khung giờ này đã được đặt, vui lòng chọn giờ khác' }, 409)

  // Kiểm tra booking có hợp lệ không
  const booking = await prisma.booking.findUnique({
    where: { id: auth.bookingId },
    select: { status: true },
  })
  if (!booking || !['CONFIRMED', 'CHECKED_IN'].includes(booking.status)) {
    return c.json({ error: 'Booking không hợp lệ để đặt spa' }, 400)
  }

  const spaBooking = await prisma.spaBooking.create({
    data: {
      bookingId: auth.bookingId,
      service: body.service,
      date: body.date,
      timeSlot: body.timeSlot,
      guests: body.guests ?? 1,
      price: svc.price,
      notes: body.notes,
    },
  })

  return c.json({ data: spaBooking }, 201)
})

// GET /api/spa/my — danh sách spa bookings của guest
spaRouter.get('/my', async (c) => {
  const auth = await getGuestBookingId(c.req.header('Authorization'))
  if (!auth) return c.json({ error: 'Chưa đăng nhập' }, 401)

  const bookings = await prisma.spaBooking.findMany({
    where: { bookingId: auth.bookingId },
    orderBy: { createdAt: 'desc' },
  })

  const result = bookings.map(b => ({
    ...b,
    serviceName: SPA_SERVICES.find(s => s.id === b.service)?.name ?? b.service,
  }))

  return c.json({ data: result })
})

// GET /api/spa — admin list all
spaRouter.get('/', async (c) => {
  const admin = await getAdminId(c.req.header('Authorization'))
  if (!admin) return c.json({ error: 'Không có quyền truy cập' }, 403)

  const date = c.req.query('date')
  const status = c.req.query('status')

  const bookings = await prisma.spaBooking.findMany({
    where: {
      ...(date ? { date } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      booking: {
        select: {
          code: true,
          user: { select: { name: true, phone: true } },
          room: { select: { number: true } },
        },
      },
    },
    orderBy: [{ date: 'asc' }, { timeSlot: 'asc' }],
  })

  const result = bookings.map(b => ({
    ...b,
    serviceName: SPA_SERVICES.find(s => s.id === b.service)?.name ?? b.service,
  }))

  return c.json({ data: result })
})

// PATCH /api/spa/:id — admin update status
spaRouter.patch('/:id', async (c) => {
  const admin = await getAdminId(c.req.header('Authorization'))
  if (!admin) return c.json({ error: 'Không có quyền truy cập' }, 403)

  const id = c.req.param('id')
  const { status } = await c.req.json<{ status: string }>()

  const updated = await prisma.spaBooking.update({
    where: { id },
    data: { status },
  })
  return c.json({ data: updated })
})
