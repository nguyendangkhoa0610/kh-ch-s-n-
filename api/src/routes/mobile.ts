import { Hono } from 'hono'
import { sign, verify } from 'hono/jwt'
import { prisma } from '@tram-huong/database'
import Anthropic from '@anthropic-ai/sdk'
import QRCode from 'qrcode'
import crypto from 'crypto'
import { sendExpoPush } from './notifications.js'

type GuestPayload = { sub: string; bookingId: string; role: string; exp: number }
type Env = { Variables: { guest: GuestPayload } }

export const mobileRouter = new Hono<Env>()

// ── Weather helper ────────────────────────────────────────────────────────────

type WeatherData = {
  temp: number
  code: number
  wind: number
  humidity: number
  description: string
  emoji: string
  isGoodForOutdoor: boolean
  suggestions: string[]
}

function decodeWeatherCode(code: number): { description: string; emoji: string; isGoodForOutdoor: boolean } {
  if (code === 0) return { description: 'trời quang đãng, nắng đẹp', emoji: '☀️', isGoodForOutdoor: true }
  if (code <= 3) return { description: 'có mây nhẹ', emoji: '⛅', isGoodForOutdoor: true }
  if (code <= 48) return { description: 'sương mù', emoji: '🌫️', isGoodForOutdoor: true }
  if (code <= 55) return { description: 'mưa phùn nhẹ', emoji: '🌦️', isGoodForOutdoor: false }
  if (code <= 65) return { description: 'đang có mưa', emoji: '🌧️', isGoodForOutdoor: false }
  if (code <= 82) return { description: 'mưa rào', emoji: '🌧️', isGoodForOutdoor: false }
  if (code <= 99) return { description: 'có giông bão', emoji: '⛈️', isGoodForOutdoor: false }
  return { description: 'thời tiết thay đổi', emoji: '🌤️', isGoodForOutdoor: true }
}

let weatherCache: { data: WeatherData; fetchedAt: number } | null = null

async function fetchWeather(): Promise<WeatherData | null> {
  // Cache 10 phút — không cần gọi API mỗi tin nhắn
  if (weatherCache && Date.now() - weatherCache.fetchedAt < 10 * 60 * 1000) {
    return weatherCache.data
  }
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=13.85&longitude=109.13' +
      '&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m' +
      '&timezone=Asia%2FHo_Chi_Minh&forecast_days=1',
      { signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return null
    const raw = await res.json() as {
      current: { temperature_2m: number; weather_code: number; wind_speed_10m: number; relative_humidity_2m: number }
    }
    const { description, emoji, isGoodForOutdoor } = decodeWeatherCode(raw.current.weather_code)
    const temp = Math.round(raw.current.temperature_2m)

    const suggestions = isGoodForOutdoor
      ? ['snorkeling & SUP kayak tại bãi biển riêng', 'trekking rừng trầm hương có hướng dẫn', 'yoga bình minh 06:00', 'đánh cá cùng ngư dân 17:00']
      : ['massage trầm hương tại Spa (đặt qua app)', 'thưởng thức ẩm thực tại Nhà hàng Trầm', 'thư giãn tại thư viện resort', 'sauna & steam room miễn phí']

    const data: WeatherData = {
      temp,
      code: raw.current.weather_code,
      wind: Math.round(raw.current.wind_speed_10m),
      humidity: raw.current.relative_humidity_2m,
      description,
      emoji,
      isGoodForOutdoor,
      suggestions,
    }
    weatherCache = { data, fetchedAt: Date.now() }
    return data
  } catch {
    return null
  }
}

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

// ── POST /api/mobile/auth/account-login — đăng nhập bằng tài khoản web ─────
// Dùng email + password (giống web), lấy booking active gần nhất

mobileRouter.post('/auth/account-login', async (c) => {
  const { default: bcrypt } = await import('bcryptjs')
  const body = await c.req.json<{ email: string; password: string }>()

  if (!body.email || !body.password) {
    return c.json({ error: 'Vui lòng nhập email và mật khẩu' }, 400)
  }

  const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } })
  if (!user || !user.passwordHash) {
    return c.json({ error: 'Email hoặc mật khẩu không đúng' }, 401)
  }
  const valid = await bcrypt.compare(body.password, user.passwordHash)
  if (!valid) return c.json({ error: 'Email hoặc mật khẩu không đúng' }, 401)

  // Lấy booking active (CONFIRMED hoặc CHECKED_IN) gần nhất
  const booking = await prisma.booking.findFirst({
    where: {
      userId: user.id,
      status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] },
    },
    include: { room: { include: { roomType: true } } },
    orderBy: { createdAt: 'desc' },
  })

  if (!booking) {
    return c.json({ error: 'Tài khoản này chưa có đặt phòng nào đang hoạt động.\nVui lòng đặt phòng trên website trước.' }, 404)
  }

  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30
  const token = await sign(
    { sub: user.id, bookingId: booking.id, role: 'GUEST', exp },
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
        guestName: user.name,
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

// Detect intent từ tin nhắn khách → trả về loại action nếu có
function detectIntent(msg: string): { type: string; details: string } | null {
  const m = msg.toLowerCase()
  if (/dọn phòng|thay (khăn|ga|chăn|gối)|vệ sinh phòng|housekeeping/.test(m))
    return { type: 'HOUSEKEEPING', details: msg }
  if (/spa|massage|facial|couple spa|trị liệu/.test(m))
    return { type: 'SPA', details: msg }
  if (/đặt xe|xe đưa đón|sân bay|xe về|taxi|transfer/.test(m))
    return { type: 'TRANSPORT', details: msg }
  if (/room service|đặt món|gọi đồ ăn|mang (đồ|thức) ăn|order (đồ|món)/.test(m))
    return { type: 'ROOM_SERVICE', details: msg }
  return null
}

const INTENT_CONFIRM: Record<string, string> = {
  HOUSEKEEPING: 'Tôi đã gửi yêu cầu dọn phòng đến đội housekeeping. Nhân viên sẽ đến trong vòng 15–20 phút!',
  SPA: 'Tôi đã ghi nhận yêu cầu đặt spa của bạn. Nhân viên spa sẽ liên hệ để xác nhận giờ trong ít phút!',
  TRANSPORT: 'Yêu cầu xe đã được gửi đến lễ tân. Lễ tân sẽ xác nhận thông tin chuyến đi sớm!',
  ROOM_SERVICE: 'Yêu cầu room service đã được ghi nhận! Bạn cũng có thể đặt món trực tiếp qua tab 🍽️ để chọn món cụ thể.',
}

mobileRouter.post('/concierge', guestAuth, async (c) => {
  const body = await c.req.json<{
    message: string
    history?: Array<{ role: 'user' | 'assistant'; content: string }>
  }>()

  if (!body.message?.trim()) return c.json({ error: 'Cần có tin nhắn' }, 400)

  const guest = c.get('guest') as GuestPayload

  // Detect intent trước — nếu match thì tạo ServiceRequest ngay, không cần gọi AI
  const intent = detectIntent(body.message)
  if (intent) {
    // Lấy booking + phòng để build context cho push và tạo HK task
    const bk = await prisma.booking.findUnique({
      where: { id: guest.bookingId },
      select: { roomId: true, room: { select: { number: true } } },
    })

    await prisma.serviceRequest.create({
      data: {
        bookingId: guest.bookingId,
        type: intent.type,
        details: intent.details,
        status: 'PENDING',
      },
    }).catch(() => {})

    if (intent.type === 'HOUSEKEEPING' && bk?.roomId) {
      await prisma.housekeepingTask.create({
        data: {
          roomId: bk.roomId,
          type: 'STAYOVER',
          priority: 'NORMAL',
          status: 'PENDING',
          scheduledFor: new Date(),
          notes: `Yêu cầu từ AI Concierge: ${body.message}`,
        },
      }).catch(() => {})
    }

    // Push notification đến tất cả STAFF/MANAGER (fire and forget)
    const TYPE_VN: Record<string, string> = {
      HOUSEKEEPING: 'Dọn phòng', SPA: 'Spa',
      TRANSPORT: 'Xe đưa đón', ROOM_SERVICE: 'Room Service',
    }
    const roomNum = bk?.room?.number
    const staffUsers = await prisma.user.findMany({
      where: { role: { in: ['STAFF', 'MANAGER'] }, pushToken: { not: null } },
      select: { pushToken: true },
    })
    const pushMsgs = staffUsers
      .filter(u => u.pushToken?.startsWith('ExponentPushToken['))
      .map(u => ({
        to: u.pushToken!,
        title: `🔔 Yêu cầu mới — ${TYPE_VN[intent.type] ?? intent.type}`,
        body: roomNum
          ? `Phòng ${roomNum}: ${intent.details.slice(0, 80)}`
          : intent.details.slice(0, 80),
        sound: 'default' as const,
        data: { type: 'SERVICE_REQUEST', requestType: intent.type },
      }))
    sendExpoPush(pushMsgs).catch(() => {})

    return c.json({ data: { reply: INTENT_CONFIRM[intent.type], action: intent.type } })
  }

  const apiKey = process.env['ANTHROPIC_API_KEY']
  if (!apiKey) {
    return c.json({
      data: { reply: 'Xin lỗi, trợ lý AI đang bảo trì. Vui lòng gọi lễ tân: bấm số 0 từ điện thoại phòng hoặc đến quầy lễ tân.' },
    })
  }

  // Lấy booking + knowledge base + weather song song
  const [booking, kbEntries, weather] = await Promise.all([
    prisma.booking.findUnique({
      where: { id: guest.bookingId },
      include: {
        user: { select: { name: true } },
        room: { include: { roomType: { select: { name: true, amenities: true } } } },
      },
    }),
    prisma.knowledgeEntry.findMany({
      where: { isActive: true },
      select: { title: true, content: true, category: true },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    }),
    fetchWeather(),
  ])

  const guestContext = booking ? `
THÔNG TIN KHÁCH ĐANG CHAT:
• Tên: ${booking.user.name}
• Phòng: ${booking.room?.number ?? 'Chưa assign'} — ${booking.room?.roomType?.name ?? 'N/A'}
• Check-in: ${booking.checkIn.toLocaleDateString('vi-VN')} | Check-out: ${booking.checkOut.toLocaleDateString('vi-VN')}
• Số khách: ${booking.guests} người
Hãy xưng tên khách khi phù hợp và cá nhân hóa câu trả lời.` : ''

  const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', weekday: 'long' })
  const weatherContext = weather ? `
THỜI TIẾT THỰC TẾ TẠI RESORT (cập nhật lúc ${now}):
• Nhiệt độ: ${weather.temp}°C ${weather.emoji}
• Tình trạng: ${weather.description}
• Gió: ${weather.wind} km/h | Độ ẩm: ${weather.humidity}%
• Thích hợp cho hoạt động ngoài trời: ${weather.isGoodForOutdoor ? 'CÓ' : 'KHÔNG'}
• Gợi ý hoạt động phù hợp hôm nay: ${weather.suggestions.join(', ')}
Khi khách hỏi về thời tiết hoặc nên làm gì, hãy dùng thông tin thực tế này.` : ''

  // RAG: tìm top 3 KB entries liên quan đến câu hỏi
  const msgLower = body.message.toLowerCase()
  const relevant = kbEntries
    .map(e => {
      const score = (e.title.toLowerCase().split(' ').filter(w => w.length > 2 && msgLower.includes(w)).length * 2)
        + (e.content.toLowerCase().split(' ').filter(w => w.length > 3 && msgLower.includes(w)).length)
      return { ...e, score }
    })
    .filter(e => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  const kbContext = relevant.length > 0
    ? `\nTHÔNG TIN CẬP NHẬT TỪ KNOWLEDGE BASE (ưu tiên cao hơn thông tin mặc định):\n${relevant.map(e => `[${e.category}] ${e.title}: ${e.content}`).join('\n')}`
    : ''

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
        cache_control: { type: 'ephemeral' },
      },
      ...(guestContext || weatherContext || kbContext ? [{
        type: 'text' as const,
        text: guestContext + weatherContext + kbContext,
      }] : []),
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
      foodOrders: {
        where: { status: { not: 'CANCELLED' } },
        include: { items: { include: { menuItem: true } } },
      },
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
    ...(booking as any).foodOrders.flatMap((order: any) =>
      order.items.map((item: any) => ({
        id: `food-${item.id}`,
        category: 'restaurant',
        description: `${item.menuItem.name} × ${item.quantity}`,
        amount: item.unitPrice * item.quantity,
        date: order.createdAt,
      }))
    ),
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

// POST /api/mobile/service-request — tạo service request trực tiếp (không qua concierge)
mobileRouter.post('/service-request', guestAuth, async (c) => {
  const guest = c.get('guest') as GuestPayload
  const body = await c.req.json<{ type: string; details: string }>()
  if (!body.type || !body.details) return c.json({ error: 'type và details là bắt buộc' }, 400)

  const sr = await prisma.serviceRequest.create({
    data: { bookingId: guest.bookingId, type: body.type, details: body.details, status: 'PENDING' },
  })

  // Push đến staff
  const staffUsers = await prisma.user.findMany({
    where: { role: { in: ['STAFF', 'MANAGER'] }, pushToken: { not: null } },
    select: { pushToken: true },
  })
  const pushMsgs = staffUsers.filter(u => u.pushToken?.startsWith('ExponentPushToken[')).map(u => ({
    to: u.pushToken!, title: '🔔 Yêu cầu mới', body: body.details.slice(0, 80),
    sound: 'default' as const, data: { type: 'SERVICE_REQUEST' },
  }))
  sendExpoPush(pushMsgs).catch(() => {})

  return c.json({ data: sr })
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

  // SOS alert created — monitored via admin dashboard

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

// ── Eco Points ───────────────────────────────────────────────────────────────

// GET /api/mobile/eco — điểm + thử thách đã hoàn thành của user
mobileRouter.get('/eco', guestAuth, async (c) => {
  const guest = c.get('guest') as any
  const user = await prisma.user.findUnique({
    where: { id: guest.sub },
    select: { ecoPoints: true, completedChallenges: true },
  })
  return c.json({ data: { ecoPoints: user?.ecoPoints ?? 0, completedChallenges: user?.completedChallenges ?? [] } })
})

// POST /api/mobile/eco/complete — hoàn thành 1 thử thách
mobileRouter.post('/eco/complete', guestAuth, async (c) => {
  const guest = c.get('guest') as any
  const { challengeId, points } = await c.req.json<{ challengeId: string; points: number }>()

  const user = await prisma.user.findUnique({
    where: { id: guest.sub },
    select: { ecoPoints: true, completedChallenges: true },
  })
  if (!user) return c.json({ error: 'User không tồn tại' }, 404)
  if (user.completedChallenges.includes(challengeId)) {
    return c.json({ data: { ecoPoints: user.ecoPoints, alreadyDone: true } })
  }

  const updated = await prisma.user.update({
    where: { id: guest.sub },
    data: {
      ecoPoints: { increment: points },
      completedChallenges: { push: challengeId },
    },
    select: { ecoPoints: true, completedChallenges: true },
  })
  return c.json({ data: { ecoPoints: updated.ecoPoints, completedChallenges: updated.completedChallenges } })
})

// POST /api/mobile/review — gửi đánh giá sau check-out
mobileRouter.post('/review', guestAuth, async (c) => {
  const guest = c.get('guest') as any
  const body = await c.req.json<{
    bookingId: string
    overallRating: number
    cleanlinessRating?: number
    serviceRating?: number
    locationRating?: number
    comment?: string
  }>()

  if (!body.bookingId || !body.overallRating) {
    return c.json({ error: 'Thiếu bookingId hoặc overallRating' }, 400)
  }

  const booking = await prisma.booking.findFirst({
    where: { id: body.bookingId, userId: guest.sub },
  })
  if (!booking) return c.json({ error: 'Booking không tồn tại' }, 404)

  const existing = await prisma.bookingReview.findUnique({ where: { bookingId: body.bookingId } })
  if (existing) return c.json({ error: 'Bạn đã đánh giá booking này rồi' }, 409)

  const review = await prisma.bookingReview.create({
    data: {
      bookingId: body.bookingId,
      overallRating: body.overallRating,
      cleanlinessRating: body.cleanlinessRating ?? 5,
      serviceRating: body.serviceRating ?? 5,
      locationRating: body.locationRating ?? 5,
      comment: body.comment,
    },
  })
  return c.json({ data: review }, 201)
})

// ── Eco Rewards & Redemption ──────────────────────────────────────────────────

// GET /api/mobile/eco/rewards — danh sách phần thưởng có thể đổi
mobileRouter.get('/eco/rewards', guestAuth, async (c) => {
  const rewards = await prisma.ecoReward.findMany({
    where: { isActive: true },
    orderBy: { pointCost: 'asc' },
  })
  return c.json({ data: rewards })
})

// POST /api/mobile/eco/redeem — đổi điểm lấy reward
mobileRouter.post('/eco/redeem', guestAuth, async (c) => {
  const guest = c.get('guest')
  const body = await c.req.json() as { rewardId: string }
  if (!body.rewardId) return c.json({ error: 'rewardId required' }, 400)

  const [reward, user] = await Promise.all([
    prisma.ecoReward.findUnique({ where: { id: body.rewardId } }),
    prisma.user.findUnique({ where: { id: guest.sub }, select: { id: true, ecoPoints: true } }),
  ])
  if (!reward || !reward.isActive) return c.json({ error: 'Phần thưởng không tồn tại' }, 404)
  if (!user) return c.json({ error: 'User not found' }, 404)
  if (user.ecoPoints < reward.pointCost) return c.json({ error: 'Không đủ điểm eco' }, 400)
  if (reward.stock === 0) return c.json({ error: 'Phần thưởng đã hết' }, 400)

  const code = `ECO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  const [redemption] = await prisma.$transaction([
    prisma.ecoRedemption.create({
      data: { userId: guest.sub, rewardId: reward.id, pointsUsed: reward.pointCost, code, expiresAt },
    }),
    prisma.user.update({ where: { id: guest.sub }, data: { ecoPoints: { decrement: reward.pointCost } } }),
    ...(reward.stock > 0 ? [prisma.ecoReward.update({ where: { id: reward.id }, data: { stock: { decrement: 1 } } })] : []),
  ])
  return c.json({ data: { ...redemption, reward } })
})

// GET /api/mobile/eco/redemptions — lịch sử đổi điểm của user
mobileRouter.get('/eco/redemptions', guestAuth, async (c) => {
  const guest = c.get('guest')
  const redemptions = await prisma.ecoRedemption.findMany({
    where: { userId: guest.sub },
    include: { reward: { select: { title: true, type: true, value: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  return c.json({ data: redemptions })
})

// GET /api/mobile/eco/leaderboard — top khách xanh
mobileRouter.get('/eco/leaderboard', guestAuth, async (c) => {
  const top = await prisma.user.findMany({
    where: { ecoPoints: { gt: 0 }, role: 'GUEST' },
    orderBy: { ecoPoints: 'desc' },
    take: 10,
    select: { name: true, ecoPoints: true },
  })
  // Ẩn bớt tên để bảo mật: "Nguyễn V. A"
  const leaderboard = top.map((u, i) => {
    const parts = u.name.trim().split(/\s+/)
    const masked = parts.length > 1
      ? `${parts[0]} ${parts.slice(1, -1).map(p => p[0] + '.').join(' ')} ${parts.at(-1)}`.trim()
      : u.name
    return { rank: i + 1, name: masked, ecoPoints: u.ecoPoints }
  })
  return c.json({ data: leaderboard })
})
