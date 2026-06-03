import { Hono } from 'hono'
import { prisma } from '@tram-huong/database'
import { generateBookingCode } from '@tram-huong/shared/utils'
import { sendBookingConfirmation, sendAdminNotification } from '../lib/email.js'
import { verify } from 'hono/jwt'

const JWT_SECRET = process.env['AUTH_SECRET'] ?? 'local-dev-secret'

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

// GET /api/bookings/my — lấy bookings của customer đang đăng nhập
bookingsRouter.get('/my', async (c) => {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) return c.json({ error: 'Chưa đăng nhập' }, 401)
  try {
    const payload = await verify(header.slice(7), JWT_SECRET, 'HS256')
    const bookings = await prisma.booking.findMany({
      where: { userId: payload['sub'] as string },
      include: {
        room: { include: { roomType: { select: { name: true, slug: true } } } },
        payment: { select: { status: true, amount: true, method: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return c.json({ data: bookings })
  } catch {
    return c.json({ error: 'Token không hợp lệ' }, 401)
  }
})

// GET /api/bookings/by-code/:code — tra cứu bằng mã đặt phòng (public)
bookingsRouter.get('/by-code/:code', async (c) => {
  const code = c.req.param('code').toUpperCase()
  const booking = await prisma.booking.findFirst({
    where: { code },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      room: { include: { roomType: { select: { name: true, slug: true } } } },
    },
  })
  if (!booking) return c.json({ error: 'Không tìm thấy đặt phòng' }, 404)
  return c.json({ data: booking })
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
    userId?: string // optional: link booking với account đã đăng nhập
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

  // Nếu đã đăng nhập → dùng account hiện tại, không tạo mới
  let user: { id: string; name: string; email: string | null; phone: string | null }
  if (body.userId) {
    const existing = await prisma.user.findUnique({ where: { id: body.userId } })
    if (existing) {
      user = existing
    } else {
      user = await prisma.user.upsert({
        where: { email: body.guestEmail },
        update: { name: body.guestName, phone: body.guestPhone },
        create: { email: body.guestEmail, name: body.guestName, phone: body.guestPhone, role: 'GUEST' },
      })
    }
  } else {
    // Tìm hoặc tạo user khách
    user = await prisma.user.upsert({
      where: { email: body.guestEmail },
      update: { name: body.guestName, phone: body.guestPhone },
      create: { email: body.guestEmail, name: body.guestName, phone: body.guestPhone, role: 'GUEST' },
    })
  }

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
  }).then((rows: { roomId: string | null }[]) => rows.map(x => x.roomId).filter(Boolean) as string[])

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

  // Lưu payment record với method người dùng chọn
  const method = (['VNPAY', 'MOMO', 'ZALOPAY', 'CASH'] as const).includes(body.paymentMethod as any)
    ? (body.paymentMethod as 'VNPAY' | 'MOMO' | 'ZALOPAY' | 'CASH')
    : 'VNPAY'
  await prisma.payment.upsert({
    where: { bookingId: booking.id },
    update: { method, amount: Math.round(totalAmount * 0.3) },
    create: { bookingId: booking.id, method, amount: Math.round(totalAmount * 0.3), status: 'PENDING' },
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

// POST /api/bookings/:id/cancel — khách hàng tự hủy booking (auth required)
bookingsRouter.post('/:id/cancel', async (c) => {
  const id = c.req.param('id')

  // Xác thực token khách hàng
  const header = c.req.header('Authorization') ?? ''
  if (!header.startsWith('Bearer ')) return c.json({ error: 'Chưa đăng nhập' }, 401)
  let userId: string
  try {
    const payload = await verify(header.slice(7), JWT_SECRET, 'HS256')
    userId = payload['sub'] as string
  } catch {
    return c.json({ error: 'Token không hợp lệ' }, 401)
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { payment: true },
  })

  if (!booking) return c.json({ error: 'Booking không tồn tại' }, 404)
  if (booking.userId !== userId) return c.json({ error: 'Không có quyền hủy booking này' }, 403)
  if (booking.status === 'CANCELLED') return c.json({ error: 'Booking đã được hủy' }, 400)
  if (['CHECKED_IN', 'COMPLETED'].includes(booking.status)) {
    return c.json({ error: 'Không thể hủy booking đã check-in hoặc hoàn thành' }, 400)
  }

  // Kiểm tra thời hạn hủy (trước 48h check-in)
  const hoursUntilCheckIn = (new Date(booking.checkIn).getTime() - Date.now()) / (1000 * 60 * 60)
  const refundPolicy = hoursUntilCheckIn >= 48
    ? 'full'          // Hoàn 100% đặt cọc
    : hoursUntilCheckIn >= 24
    ? 'half'          // Hoàn 50% đặt cọc
    : 'none'          // Không hoàn

  await prisma.booking.update({ where: { id }, data: { status: 'CANCELLED' } })

  const refundMessages: Record<string, string> = {
    full: 'Hoàn 100% đặt cọc trong 3–5 ngày làm việc.',
    half: 'Hoàn 50% đặt cọc do hủy trong vòng 48 giờ.',
    none: 'Không hoàn đặt cọc do hủy trong vòng 24 giờ trước check-in.',
  }

  return c.json({
    data: { success: true, refundPolicy, message: refundMessages[refundPolicy] },
  })
})
