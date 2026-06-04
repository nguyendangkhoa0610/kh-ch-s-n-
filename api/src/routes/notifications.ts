import { Hono } from 'hono'
import { prisma } from '@tram-huong/database'
import { verify } from 'hono/jwt'

const JWT_SECRET = process.env['AUTH_SECRET'] ?? 'local-dev-secret'
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

export const notificationsRouter = new Hono()

type ExpoPushMessage = {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
  sound?: 'default'
  badge?: number
}

async function sendExpoPush(messages: ExpoPushMessage[]) {
  if (!messages.length) return
  const chunks: ExpoPushMessage[][] = []
  for (let i = 0; i < messages.length; i += 100) chunks.push(messages.slice(i, i + 100))

  for (const chunk of chunks) {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(chunk),
    }).catch(() => {/* fire and forget */})
  }
}

// POST /api/notifications/register — lưu push token của user
notificationsRouter.post('/register', async (c) => {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) return c.json({ error: 'Chưa đăng nhập' }, 401)
  let userId: string
  try {
    const p = await verify(header.slice(7), JWT_SECRET, 'HS256')
    userId = p['sub'] as string
  } catch { return c.json({ error: 'Token không hợp lệ' }, 401) }

  const { pushToken } = await c.req.json<{ pushToken: string }>()
  if (!pushToken?.startsWith('ExponentPushToken[')) {
    return c.json({ error: 'Token không hợp lệ' }, 400)
  }

  await prisma.user.update({ where: { id: userId }, data: { pushToken } })
  return c.json({ ok: true })
})

// POST /api/notifications/send — admin gửi notification đến user(s)
notificationsRouter.post('/send', async (c) => {
  const body = await c.req.json<{
    userIds?: string[]
    roles?: string[]   // GUEST | STAFF | ALL
    title: string
    message: string
    data?: Record<string, unknown>
  }>()

  let users: { pushToken: string | null }[] = []

  if (body.userIds?.length) {
    users = await prisma.user.findMany({
      where: { id: { in: body.userIds } },
      select: { pushToken: true },
    })
  } else if (body.roles?.length) {
    const where = body.roles.includes('ALL')
      ? {}
      : { role: { in: body.roles } }
    users = await prisma.user.findMany({ where, select: { pushToken: true } })
  }

  const messages: ExpoPushMessage[] = users
    .filter(u => u.pushToken?.startsWith('ExponentPushToken['))
    .map(u => ({
      to: u.pushToken!,
      title: body.title,
      body: body.message,
      sound: 'default',
      data: body.data,
    }))

  await sendExpoPush(messages)
  return c.json({ ok: true, sent: messages.length })
})

// POST /api/notifications/booking-confirmed/:bookingId — gửi thông báo xác nhận đặt phòng
notificationsRouter.post('/booking-confirmed/:bookingId', async (c) => {
  const bookingId = c.req.param('bookingId')
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { user: { select: { pushToken: true } } },
  })
  if (!booking || !booking.user.pushToken) return c.json({ ok: true, sent: 0 })

  await sendExpoPush([{
    to: booking.user.pushToken,
    title: '✅ Đặt phòng xác nhận',
    body: `Booking ${booking.code} đã được xác nhận. Check-in: ${new Date(booking.checkIn).toLocaleDateString('vi-VN')}`,
    sound: 'default',
    data: { type: 'booking_confirmed', bookingId },
  }])
  return c.json({ ok: true, sent: 1 })
})

// Gửi thông báo nội bộ cho staff export (helper dùng từ các route khác)
export { sendExpoPush }
