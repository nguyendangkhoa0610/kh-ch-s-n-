import { Hono } from 'hono'
import { sign, verify } from 'hono/jwt'
import { prisma } from '@tram-huong/database'
import Anthropic from '@anthropic-ai/sdk'
import QRCode from 'qrcode'
import crypto from 'crypto'

type GuestPayload = { sub: string; bookingId: string; role: string; exp: number }
type Env = { Variables: { guest: GuestPayload } }

export const mobileRouter = new Hono<Env>()

const JWT_SECRET = process.env['AUTH_SECRET'] ?? 'local-dev-secret'

// ── Auth middleware ──────────────────────────────────────────────────────────

async function guestAuth(c: any, next: any) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Chưa đăng nhập' }, 401)
  }
  try {
    const payload = await verify(authHeader.slice(7), JWT_SECRET, 'HS256')
    c.set('guest', payload as GuestPayload)
    await next()
  } catch {
    return c.json({ error: 'Token không hợp lệ' }, 401)
  }
}

// ── POST /api/mobile/auth/login ──────────────────────────────────────────────

mobileRouter.post('/auth/login', async (c) => {
  const body = await c.req.json<{ bookingCode: string; guestName: string }>()

  if (!body.bookingCode || !body.guestName) {
    return c.json({ error: 'Cần nhập mã đặt phòng và tên' }, 400)
  }

  const booking = await prisma.booking.findUnique({
    where: { code: body.bookingCode.toUpperCase() },
    include: {
      user: true,
      room: { include: { roomType: true } },
    },
  })

  if (!booking) return c.json({ error: 'Mã đặt phòng không tồn tại' }, 404)
  if (booking.status === 'CANCELLED') return c.json({ error: 'Booking đã bị hủy' }, 400)

  // Flexible name check
  const input = body.guestName.toLowerCase().trim()
  const name = booking.user.name.toLowerCase().trim()
  if (!name.includes(input) && !input.includes(name)) {
    return c.json({ error: 'Tên không khớp với mã đặt phòng' }, 401)
  }

  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 // 30 ngày
  const token = await sign(
    { sub: booking.userId, bookingId: booking.id, role: 'GUEST', exp },
    JWT_SECRET
  )

  return c.json({
    data: {
      token,
      booking: {
        id: booking.id,
        code: booking.code,
        status: booking.status,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guests: booking.guests,
        roomNumber: booking.room?.number ?? null,
        roomName: booking.room?.roomType?.name ?? null,
        guestName: booking.user.name,
      },
    },
  })
})

// ── GET /api/mobile/key ──────────────────────────────────────────────────────

mobileRouter.get('/key', guestAuth, async (c) => {
  const guest = c.get('guest') as any
  const bookingId = guest.bookingId

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { room: true, digitalKey: true },
  })

  if (!booking) return c.json({ error: 'Booking không tồn tại' }, 404)
  if (!booking.room) return c.json({ error: 'Phòng chưa được phân công — liên hệ lễ tân' }, 400)

  let key = booking.digitalKey

  // Tạo / gia hạn key nếu cần
  if (!key || key.revokedAt || new Date() > key.validUntil) {
    const token = crypto.randomBytes(32).toString('hex')
    const qrPayload = JSON.stringify({
      token,
      bookingId,
      roomId: booking.room.id,
      roomNumber: booking.room.number,
    })
    const qrCode = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400,
    })

    key = await prisma.digitalKey.upsert({
      where: { bookingId },
      create: {
        bookingId,
        token,
        qrCode,
        validFrom: booking.checkIn,
        validUntil: booking.checkOut,
      },
      update: {
        token,
        qrCode,
        validFrom: booking.checkIn,
        validUntil: booking.checkOut,
        revokedAt: null,
      },
    })
  }

  return c.json({
    data: {
      qrCode: key.qrCode,
      roomNumber: booking.room.number,
      validFrom: key.validFrom,
      validUntil: key.validUntil,
    },
  })
})

// ── POST /api/mobile/concierge ───────────────────────────────────────────────

const CONCIERGE_SYSTEM = `Bạn là AI Concierge của Trầm Hương Eco-Resort — khu nghỉ dưỡng sinh thái cao cấp tại Bình Định, Việt Nam.

PHONG CÁCH: Thân thiện, ấm áp như người bạn địa phương am hiểu resort. Trả lời tiếng Việt, tối đa 180 từ trừ khi cần liệt kê chi tiết. Không dùng bullet list quá nhiều — ưu tiên văn xuôi tự nhiên.

THÔNG TIN RESORT:
• Địa chỉ: Xã Cát Khánh, Phù Cát, Bình Định | Tọa độ: 13.9°N, 108.9°E
• Diện tích: 12 hecta | Bãi biển riêng 300m | Rừng trầm hương nguyên sinh

THỜI GIAN & QUY ĐỊNH:
• Check-in: 14:00 | Check-out: 12:00 | Late check-out: liên hệ lễ tân
• Bữa sáng: 06:30–09:30 tại Nhà hàng Trầm (bao gồm trong giá phòng)
• Hồ bơi vô cực: 06:30–20:00 | Spa & wellness: 09:00–21:00
• Phòng gym: 06:00–22:00 | Thư viện: 08:00–22:00
• WiFi tên mạng: TramHuong_Resort | Mật khẩu: tramhuong2026

LIÊN HỆ NỘI BỘ (từ điện thoại phòng):
• Lễ tân 24/7: số 0 | Room service 24/7: số 1
• Spa: số 2 | Nhà hàng: số 3 | Bảo vệ: số 9

ẨM THỰC:
• Nhà hàng Trầm: món Việt sáng tạo, hải sản Bình Định tươi sống
• Pool Bar: cocktail, sinh tố, đồ ăn nhẹ 10:00–19:00
• BBQ bãi biển: tối thứ 6 & thứ 7 (cần đặt trước)
• Room service: menu đầy đủ 24/7, phí dịch vụ 15%

CÁC HOẠT ĐỘNG:
• Lặn snorkeling & SUP kayak (06:30–17:00, miễn phí thiết bị cơ bản)
• Yoga bình minh trên bãi biển (06:00 hàng ngày, miễn phí)
• Đánh cá cùng ngư dân (17:00–22:00, đặt trước 1 ngày)
• Trekking rừng trầm hương (07:00 & 14:00, có hướng dẫn)
• Lửa trại & kể chuyện (tối thứ 4 & chủ nhật)
• Eco Challenge: check-in ở app để tích điểm

SPA & WELLNESS (đặt qua app hoặc số 2):
• Massage trầm hương đặc trưng (90 phút): 850.000đ
• Facial thảo mộc Bình Định (60 phút): 650.000đ
• Couple spa (120 phút): 1.500.000đ/cặp
• Sauna & steam room: miễn phí cho khách lưu trú

GIAO THÔNG:
• Sân bay Phù Cát: 25 phút (shuttle miễn phí, đặt trước)
• TP. Quy Nhơn: 35 phút (xe resort: 200.000đ/chiều)
• Kỳ Co: 40 phút | Eo Gió: 50 phút | Ghềnh Ráng: 30 phút

KHẨN CẤP: Hướng dẫn khách bấm nút SOS màu đỏ trong app để được hỗ trợ ngay lập tức.`

mobileRouter.post('/concierge', guestAuth, async (c) => {
  const body = await c.req.json<{
    message: string
    history?: Array<{ role: 'user' | 'assistant'; content: string }>
  }>()

  if (!body.message?.trim()) return c.json({ error: 'Cần có tin nhắn' }, 400)

  const apiKey = process.env['ANTHROPIC_API_KEY']
  if (!apiKey) {
    return c.json({
      data: { reply: 'Xin lỗi, trợ lý AI đang bảo trì. Vui lòng gọi lễ tân: bấm số 0 từ điện thoại phòng hoặc đến quầy lễ tân.' },
    })
  }

  // Lấy thông tin booking của khách để cá nhân hóa
  const guest = c.get('guest') as GuestPayload
  const booking = await prisma.booking.findUnique({
    where: { id: guest.bookingId },
    include: {
      user: { select: { name: true } },
      room: { include: { roomType: { select: { name: true, amenities: true } } } },
    },
  })

  const guestContext = booking ? `
THÔNG TIN KHÁCH ĐANG CHAT:
• Tên: ${booking.user.name}
• Phòng: ${booking.room?.number ?? 'Chưa assign'} — ${booking.room?.roomType?.name ?? 'N/A'}
• Check-in: ${booking.checkIn.toLocaleDateString('vi-VN')} | Check-out: ${booking.checkOut.toLocaleDateString('vi-VN')}
• Số khách: ${booking.guests} người
Hãy xưng tên khách khi phù hợp và cá nhân hóa câu trả lời.` : ''

  const anthropic = new Anthropic({ apiKey })

  const messages: Anthropic.MessageParam[] = [
    ...(body.history ?? []).map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
    { role: 'user', content: body.message },
  ]

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: CONCIERGE_SYSTEM,
        cache_control: { type: 'ephemeral' }, // cache system prompt tĩnh
      },
      ...(guestContext ? [{ type: 'text' as const, text: guestContext }] : []),
    ],
    messages,
  })

  const firstBlock = response.content[0]
  const reply = firstBlock?.type === 'text' ? (firstBlock as Anthropic.TextBlock).text : ''

  return c.json({ data: { reply } })
})

// ── GET /api/mobile/bill ─────────────────────────────────────────────────────

mobileRouter.get('/bill', guestAuth, async (c) => {
  const guest = c.get('guest') as any

  const booking = await prisma.booking.findUnique({
    where: { id: guest.bookingId },
    include: {
      room: { include: { roomType: true } },
      activities: { include: { schedule: { include: { activity: true } } } },
      payment: true,
    },
  })

  if (!booking) return c.json({ error: 'Booking không tồn tại' }, 404)

  const nights = Math.ceil(
    (booking.checkOut.getTime() - booking.checkIn.getTime()) / (1000 * 60 * 60 * 24)
  )
  const roomAmount =
    booking.room?.roomType?.basePrice != null
      ? booking.room.roomType.basePrice * nights
      : booking.totalAmount

  const items = [
    {
      id: 'room',
      category: 'room',
      description: `${booking.room?.roomType?.name ?? 'Phòng'} × ${nights} đêm`,
      amount: roomAmount,
      date: booking.checkIn,
    },
    ...booking.activities.map((ab: { id: string; guests: number; schedule: { startTime: Date; activity: { name: string; price: number } } }) => ({
      id: ab.id,
      category: 'activity',
      description: `${ab.schedule.activity.name} × ${ab.guests} người`,
      amount: ab.schedule.activity.price * ab.guests,
      date: ab.schedule.startTime,
    })),
  ]

  const total = items.reduce((s, i) => s + i.amount, 0)
  const paid = booking.payment?.status === 'SUCCESS' ? booking.payment.amount : 0

  return c.json({
    data: {
      bookingCode: booking.code,
      items,
      total,
      paid,
      balance: total - paid,
      paymentStatus: booking.payment?.status ?? 'PENDING',
    },
  })
})

// ── POST /api/mobile/sos ─────────────────────────────────────────────────────

mobileRouter.post('/sos', guestAuth, async (c) => {
  const guest = c.get('guest') as any
  const body = await c.req.json<{
    type?: string
    message?: string
    location?: { lat: number; lng: number; area: string }
  }>()

  const alert = await prisma.sOSAlert.create({
    data: {
      userId: guest.sub,
      type: body.type ?? 'SOS',
      location: JSON.stringify(
        body.location ?? { lat: 13.9, lng: 108.9, area: 'Không xác định' }
      ),
      message: body.message,
    },
  })

  console.log(`[SOS] Alert created: ${alert.id} — type: ${alert.type}`)

  return c.json({ data: { alertId: alert.id, status: alert.status } }, 201)
})

// ── GET /api/mobile/room ─────────────────────────────────────────────────────

mobileRouter.get('/room', guestAuth, async (c) => {
  // Mock IoT state — production: fetch from IoT platform
  return c.json({
    data: {
      ac: { on: true, temperature: 24, mode: 'cool' },
      lights: { main: true, bedside: false, bathroom: true, brightness: 80 },
      tv: { on: false, channel: 1 },
      curtains: { open: true, percentage: 100 },
      doNotDisturb: false,
    },
  })
})

// ── PATCH /api/mobile/room ───────────────────────────────────────────────────

mobileRouter.patch('/room', guestAuth, async (c) => {
  const body = await c.req.json()
  // Mock: echo back (production: forward to IoT platform)
  return c.json({ data: { updated: true, controls: body } })
})
