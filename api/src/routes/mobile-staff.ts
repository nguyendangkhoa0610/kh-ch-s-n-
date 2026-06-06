import { Hono } from 'hono'
import { sign, verify } from 'hono/jwt'
import { prisma } from '@tram-huong/database'
import bcrypt from 'bcryptjs'
import { sendReviewInvite } from '../lib/email.js'

type StaffPayload = { sub: string; role: string; name: string; exp: number }
type Env = { Variables: { staff: StaffPayload } }

export const mobileStaffRouter = new Hono<Env>()

const JWT_SECRET = process.env['AUTH_SECRET'] ?? 'local-dev-secret'

// ── Auth middleware ──────────────────────────────────────────────────────────

async function staffAuth(c: any, next: any) {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) return c.json({ error: 'Chưa đăng nhập' }, 401)
  try {
    const payload = await verify(header.slice(7), JWT_SECRET, 'HS256')
    const role = payload['role'] as string
    if (!['STAFF', 'MANAGER', 'ADMIN'].includes(role)) {
      return c.json({ error: 'Không có quyền truy cập' }, 403)
    }
    c.set('staff', payload as StaffPayload)
    await next()
  } catch {
    return c.json({ error: 'Token không hợp lệ' }, 401)
  }
}

// ── POST /api/mobile/staff/auth/login ────────────────────────────────────────

mobileStaffRouter.post('/auth/login', async (c) => {
  const body = await c.req.json<{ email: string; password: string }>()
  if (!body.email || !body.password) {
    return c.json({ error: 'Cần nhập email và mật khẩu' }, 400)
  }

  const user = await prisma.user.findUnique({ where: { email: body.email } })
  if (!user || !user.passwordHash) {
    return c.json({ error: 'Email hoặc mật khẩu không đúng' }, 401)
  }
  if (!['STAFF', 'MANAGER', 'ADMIN'].includes(user.role)) {
    return c.json({ error: 'Tài khoản không có quyền nhân viên' }, 403)
  }

  const valid = await bcrypt.compare(body.password, user.passwordHash)
  if (!valid) return c.json({ error: 'Email hoặc mật khẩu không đúng' }, 401)

  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 ngày
  const token = await sign(
    { sub: user.id, role: user.role, name: user.name, exp },
    JWT_SECRET
  )

  return c.json({
    data: {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    },
  })
})

// ── GET /api/mobile/staff/shifts ─────────────────────────────────────────────

mobileStaffRouter.get('/shifts', staffAuth, async (c) => {
  const staff = c.get('staff')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const shifts = await prisma.shift.findMany({
    where: {
      staffId: staff.sub,
      startTime: { gte: today, lt: tomorrow },
    },
    orderBy: { startTime: 'asc' },
  })

  const allTodayShifts = await prisma.shift.count({
    where: { startTime: { gte: today, lt: tomorrow } },
  })

  return c.json({ data: { shifts, totalStaffOnDuty: allTodayShifts } })
})

// ── GET /api/mobile/staff/sos-alerts ─────────────────────────────────────────

mobileStaffRouter.get('/sos-alerts', staffAuth, async (c) => {
  const alerts = await prisma.sOSAlert.findMany({
    where: { status: { in: ['NEW', 'RESPONDING'] } },
    include: { user: { select: { name: true, phone: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return c.json({ data: alerts })
})

// ── PATCH /api/mobile/staff/sos-alerts/:id ───────────────────────────────────

mobileStaffRouter.patch('/sos-alerts/:id', staffAuth, async (c) => {
  const staff = c.get('staff')
  const id = c.req.param('id')
  const body = await c.req.json<{ status: string }>()

  const alert = await prisma.sOSAlert.update({
    where: { id },
    data: {
      status: body.status,
      respondedBy: body.status === 'RESPONDING' ? staff.sub : undefined,
      respondedAt: body.status === 'RESPONDING' ? new Date() : undefined,
    },
  })
  return c.json({ data: alert })
})

// ── GET /api/mobile/staff/bookings/today ─────────────────────────────────────
// Danh sách check-in hôm nay (CONFIRMED) + check-out hôm nay (CHECKED_IN)

mobileStaffRouter.get('/bookings/today', staffAuth, async (c) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const select = {
    id: true, code: true, status: true, checkIn: true, checkOut: true, guests: true,
    user: { select: { name: true, phone: true } },
    room: { select: { number: true, roomType: { select: { name: true } } } },
  }

  const [arrivals, departures] = await Promise.all([
    prisma.booking.findMany({
      where: { status: { in: ['PENDING', 'CONFIRMED'] }, checkIn: { gte: today, lt: tomorrow } },
      select,
      orderBy: { checkIn: 'asc' },
    }),
    prisma.booking.findMany({
      where: { status: 'CHECKED_IN', checkOut: { gte: today, lt: tomorrow } },
      select,
      orderBy: { checkOut: 'asc' },
    }),
  ])

  return c.json({ data: { arrivals, departures } })
})

// ── GET /api/mobile/staff/bookings/by-qr ─────────────────────────────────────
// Staff quét QR của khách → lấy thông tin booking

mobileStaffRouter.get('/bookings/by-qr', staffAuth, async (c) => {
  const token = c.req.query('token')
  if (!token) return c.json({ error: 'Cần có token QR' }, 400)

  const key = await prisma.digitalKey.findUnique({
    where: { token },
    include: {
      booking: {
        include: {
          user: { select: { name: true, phone: true, email: true } },
          room: { include: { roomType: true } },
        },
      },
    },
  })

  if (!key) return c.json({ error: 'Mã QR không hợp lệ' }, 404)
  if (key.revokedAt || new Date() > key.validUntil) {
    return c.json({ error: 'Mã QR đã hết hạn' }, 410)
  }

  return c.json({
    data: {
      bookingId: key.booking.id,
      bookingCode: key.booking.code,
      guestName: key.booking.user.name,
      guestPhone: key.booking.user.phone,
      roomNumber: key.booking.room?.number ?? null,
      roomName: key.booking.room?.roomType?.name ?? null,
      checkIn: key.booking.checkIn,
      checkOut: key.booking.checkOut,
      guests: key.booking.guests,
      status: key.booking.status,
    },
  })
})

// ── PATCH /api/mobile/staff/bookings/:id/checkin ─────────────────────────────

mobileStaffRouter.patch('/bookings/:id/checkin', staffAuth, async (c) => {
  const id = c.req.param('id')
  const booking = await prisma.booking.findUnique({ where: { id } })
  if (!booking) return c.json({ error: 'Booking không tồn tại' }, 404)
  if (booking.status === 'CHECKED_IN') {
    return c.json({ data: { alreadyCheckedIn: true, booking } })
  }
  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
    return c.json({ error: `Không thể check-in booking ở trạng thái ${booking.status}` }, 400)
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: 'CHECKED_IN' },
  })
  return c.json({ data: { success: true, booking: updated } })
})

// ── PATCH /api/mobile/staff/bookings/:id/checkout ────────────────────────────

mobileStaffRouter.patch('/bookings/:id/checkout', staffAuth, async (c) => {
  const id = c.req.param('id')
  const booking = await prisma.booking.findUnique({ where: { id } })
  if (!booking) return c.json({ error: 'Booking không tồn tại' }, 404)
  if (booking.status !== 'CHECKED_IN') {
    return c.json({ error: 'Khách chưa check-in' }, 400)
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: 'COMPLETED' },
    include: {
      user: true,
      room: { include: { roomType: true } },
    },
  })

  // Gửi email mời review async (không block response)
  if (updated.user.email) {
    const nights = Math.ceil(
      (updated.checkOut.getTime() - updated.checkIn.getTime()) / 86_400_000
    )
    sendReviewInvite({
      guestName: updated.user.name,
      guestEmail: updated.user.email,
      bookingCode: updated.code,
      roomName: updated.room?.roomType.name ?? 'Trầm Hương',
      nights,
    }).catch(() => {})
  }

  return c.json({ data: { success: true, booking: updated } })
})

// ── POST /api/mobile/staff/incidents ─────────────────────────────────────────

mobileStaffRouter.post('/incidents', staffAuth, async (c) => {
  const staff = c.get('staff')
  const body = await c.req.json<{
    area: string
    description: string
    severity?: string
    photoUrl?: string
  }>()

  if (!body.area || !body.description) {
    return c.json({ error: 'Cần nhập khu vực và mô tả' }, 400)
  }

  const report = await prisma.incidentReport.create({
    data: {
      reporterId: staff.sub,
      area: body.area,
      description: body.description,
      severity: body.severity ?? 'LOW',
      photoUrl: body.photoUrl,
    },
  })

  return c.json({ data: report }, 201)
})

// ── GET /api/mobile/staff/messages/:team ─────────────────────────────────────

mobileStaffRouter.get('/messages/:team', staffAuth, async (c) => {
  const team = c.req.param('team')
  const messages = await prisma.message.findMany({
    where: { team: { in: [team, 'all'] } },
    include: { sender: { select: { name: true, role: true } } },
    orderBy: { createdAt: 'asc' },
    take: 50,
  })
  return c.json({ data: messages })
})

// ── POST /api/mobile/staff/messages ──────────────────────────────────────────

mobileStaffRouter.post('/messages', staffAuth, async (c) => {
  const staff = c.get('staff')
  const body = await c.req.json<{ team: string; content: string }>()

  if (!body.content?.trim()) return c.json({ error: 'Cần có nội dung tin nhắn' }, 400)

  const message = await prisma.message.create({
    data: {
      senderId: staff.sub,
      team: body.team ?? 'all',
      content: body.content.trim(),
    },
    include: { sender: { select: { name: true, role: true } } },
  })
  return c.json({ data: message }, 201)
})

// ── POST /api/mobile/staff/maintenance ───────────────────────────────────────

mobileStaffRouter.post('/maintenance', staffAuth, async (c) => {
  const staff = c.get('staff')
  const body = await c.req.json<{
    roomId: string; title: string; description: string
    category?: string; priority?: string; photoUrl?: string
  }>()
  if (!body.roomId || !body.title) return c.json({ error: 'Thiếu roomId hoặc title' }, 400)

  const req = await prisma.maintenanceRequest.create({
    data: {
      roomId: body.roomId,
      reporterId: staff.sub,
      title: body.title,
      description: body.description ?? '',
      category: body.category ?? 'OTHER',
      priority: body.priority ?? 'NORMAL',
      photoUrl: body.photoUrl,
    },
    include: { room: { select: { number: true } } },
  })
  return c.json({ data: req }, 201)
})

// ── GET /api/mobile/staff/maintenance ────────────────────────────────────────

mobileStaffRouter.get('/maintenance', staffAuth, async (c) => {
  const status = c.req.query('status')
  const reqs = await prisma.maintenanceRequest.findMany({
    where: status ? { status } : {},
    include: {
      room: { select: { number: true, roomType: { select: { name: true } } } },
      reporter: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return c.json({ data: reqs })
})

// ── PATCH /api/mobile/staff/maintenance/:id ───────────────────────────────────

mobileStaffRouter.patch('/maintenance/:id', staffAuth, async (c) => {
  const id = c.req.param('id')
  const { status } = await c.req.json<{ status: string }>()
  const req = await prisma.maintenanceRequest.update({
    where: { id },
    data: {
      status,
      ...(status === 'RESOLVED' ? { resolvedAt: new Date() } : {}),
    },
  })
  return c.json({ data: req })
})

// ── GET /api/mobile/staff/stats ───────────────────────────────────────────────

mobileStaffRouter.get('/stats', staffAuth, async (c) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const [pendingSOS, checkInsToday, pendingBookings] = await Promise.all([
    prisma.sOSAlert.count({ where: { status: 'NEW' } }),
    prisma.booking.count({ where: { status: { in: ['PENDING', 'CONFIRMED'] }, checkIn: { gte: today, lt: tomorrow } } }),
    prisma.booking.count({ where: { status: 'PENDING' } }),
  ])

  return c.json({ data: { pendingSOS, checkInsToday, pendingBookings } })
})
