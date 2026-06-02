import { Hono } from 'hono'
import { prisma } from '@tram-huong/database'
import { generateBookingCode } from '@tram-huong/shared/utils'
import { sendBookingConfirmation, sendAdminNotification } from '../lib/email.js'

export const bookingsRouter = new Hono()

// GET /api/bookings
bookingsRouter.get('/', async (c) => {
  const status = c.req.query('status')
  const bookings = await prisma.booking.findMany({
    where: status ? { status } : undefined,
    include: { user: true, room: { include: { roomType: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return c.json({ data: bookings })
})

// GET /api/bookings/:id
bookingsRouter.get('/:id', async (c) => {
  const id = c.req.param('id')
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      user: true,
      room: { include: { roomType: true } },
      payment: true,
      activities: { include: { schedule: { include: { activity: true } } } },
    },
  })
  if (!booking) return c.json({ error: 'Booking không tồn tại' }, 404)
  return c.json({ data: booking })
})

// POST /api/bookings/guest — đặt phòng không cần tài khoản
bookingsRouter.post('/guest', async (c) => {
  const body = await c.req.json<{
    guestName: string
    guestEmail: string
    guestPhone: string
    roomSlug: string
    checkIn: string
    checkOut: string
    guests: number
    paymentMethod: string
    notes?: string
  }>()

  // Validate
  if (!body.guestName || !body.guestEmail || !body.guestPhone) {
    return c.json({ error: 'Thiếu thông tin khách' }, 400)
  }
  if (!body.roomSlug || !body.checkIn || !body.checkOut) {
    return c.json({ error: 'Thiếu thông tin đặt phòng' }, 400)
  }

  const checkIn = new Date(body.checkIn)
  const checkOut = new Date(body.checkOut)
  if (checkOut <= checkIn) {
    return c.json({ error: 'Ngày trả phòng phải sau ngày nhận phòng' }, 400)
  }

  // Tìm hoặc tạo user khách
  const user = await prisma.user.upsert({
    where: { email: body.guestEmail },
    update: { name: body.guestName, phone: body.guestPhone },
    create: {
      email: body.guestEmail,
      name: body.guestName,
      phone: body.guestPhone,
      role: 'GUEST',
    },
  })

  // Tìm phòng trống theo loại phòng
  const roomType = await prisma.roomType.findUnique({ where: { slug: body.roomSlug } })
  if (!roomType) return c.json({ error: 'Loại phòng không tồn tại' }, 404)

  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
  const totalAmount = roomType.basePrice * nights

  // Tìm phòng available (không bị trùng booking)
  const occupiedRoomIds = await prisma.booking.findMany({
    where: {
      status: { notIn: ['CANCELLED'] },
      room: { roomTypeId: roomType.id },
      OR: [
        { checkIn: { lt: checkOut }, checkOut: { gt: checkIn } },
      ],
    },
    select: { roomId: true },
  }).then((b) => b.map((x: { roomId: string | null }) => x.roomId).filter(Boolean) as string[])

  const availableRoom = await prisma.room.findFirst({
    where: {
      roomTypeId: roomType.id,
      status: 'AVAILABLE',
      id: { notIn: occupiedRoomIds },
    },
  })

  // Tạo booking
  const booking = await prisma.booking.create({
    data: {
      code: generateBookingCode(),
      userId: user.id,
      roomId: availableRoom?.id ?? null,
      checkIn,
      checkOut,
      guests: body.guests,
      totalAmount,
      notes: [
        body.notes,
        !availableRoom ? `[Phòng chưa assign — loại: ${roomType.name}]` : null,
      ]
        .filter(Boolean)
        .join(' | ') || null,
    },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      room: { include: { roomType: true } },
    },
  })

  // Gửi email xác nhận khách + thông báo admin (non-blocking, song song)
  const emailParams = {
    guestName: user.name,
    guestEmail: user.email ?? body.guestEmail,
    bookingCode: booking.code,
    roomName: roomType.name,
    roomNumber: availableRoom?.number ?? null,
    checkIn: body.checkIn,
    checkOut: body.checkOut,
    guests: body.guests,
    totalAmount,
  }
  Promise.all([
    sendBookingConfirmation(emailParams),
    sendAdminNotification({ ...emailParams, guestPhone: body.guestPhone }),
  ]).catch((err) => console.error('[Email] Failed:', err))

  return c.json({ data: booking }, 201)
})

// POST /api/bookings — internal (yêu cầu userId)
bookingsRouter.post('/', async (c) => {
  const body = await c.req.json<{
    userId: string
    roomId?: string
    checkIn: string
    checkOut: string
    guests: number
    totalAmount: number
    notes?: string
  }>()

  const booking = await prisma.booking.create({
    data: {
      code: generateBookingCode(),
      userId: body.userId,
      roomId: body.roomId,
      checkIn: new Date(body.checkIn),
      checkOut: new Date(body.checkOut),
      guests: body.guests,
      totalAmount: body.totalAmount,
      notes: body.notes,
    },
    include: { user: true, room: { include: { roomType: true } } },
  })

  return c.json({ data: booking }, 201)
})

// PATCH /api/bookings/:id/status
bookingsRouter.patch('/:id/status', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{ status: string }>()
  const booking = await prisma.booking.update({
    where: { id },
    data: { status: body.status },
  })
  return c.json({ data: booking })
})
