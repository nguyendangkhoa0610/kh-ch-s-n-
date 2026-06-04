import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'

import { roomsRouter } from './routes/rooms.js'
import { bookingsRouter } from './routes/bookings.js'
import { activitiesRouter } from './routes/activities.js'
import { authRouter } from './routes/auth.js'
import { paymentsRouter } from './routes/payments.js'
import { reportsRouter } from './routes/reports.js'
import { staffRouter } from './routes/staff.js'
import { mobileRouter } from './routes/mobile.js'
import { mobileStaffRouter } from './routes/mobile-staff.js'
import { reviewsRouter } from './routes/reviews.js'
import { promoRouter } from './routes/promo.js'
import { housekeepingRouter } from './routes/housekeeping.js'
import { settingsRouter } from './routes/settings.js'
import { exportRouter } from './routes/export.js'
import { menuRouter } from './routes/menu.js'
import { vouchersRouter } from './routes/vouchers.js'
import { wishlistRouter } from './routes/wishlist.js'
import { notificationsRouter } from './routes/notifications.js'
import { pricingRouter } from './routes/pricing.js'
import { maintenanceRouter } from './routes/maintenance.js'
import { chatRouter } from './routes/chat.js'
import { treesRouter } from './routes/trees.js'
import { sendBookingReminder } from './lib/email.js'
import { prisma } from '@tram-huong/database'

const app = new Hono().basePath('/api')

// ── Rate limiter in-memory đơn giản ──────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
function rateLimit(maxPerWindow: number, windowMs: number) {
  return async (c: any, next: any) => {
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? c.req.header('x-real-ip') ?? 'unknown'
    const now = Date.now()
    const entry = rateLimitMap.get(ip)
    if (!entry || entry.resetAt < now) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    } else {
      entry.count++
      if (entry.count > maxPerWindow) {
        return c.json({ error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' }, 429)
      }
    }
    await next()
  }
}
// Cleanup map mỗi 5 phút tránh memory leak
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (entry.resetAt < now) rateLimitMap.delete(ip)
  }
}, 5 * 60 * 1000)

// Middleware
app.use('*', logger())
app.use('*', prettyJSON())
// Rate limit: auth routes 10 req/phút, global 200 req/phút
app.use('/auth/*', rateLimit(10, 60_000))
app.use('*', rateLimit(200, 60_000))
const ALLOWED_ORIGINS = [
  // Local dev
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8081',
  // Production Vercel
  'https://tram-huong-web.vercel.app',
  'https://tram-huong-admin.vercel.app',
  // Custom domain (khi có)
  'https://tramhuong-resort.vn',
  'https://www.tramhuong-resort.vn',
  // Vercel preview URLs
]

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return '*' // mobile app / curl
      if (ALLOWED_ORIGINS.some((o) => origin.startsWith(o))) return origin
      if (origin.endsWith('.vercel.app')) return origin // Vercel preview deployments
      return null
    },
    credentials: true,
  }),
)

// Health check
app.get('/health', (c) => c.json({ status: 'ok', service: 'tram-huong-api', ts: new Date() }))

// Routes
app.route('/auth', authRouter)
app.route('/rooms', roomsRouter)
app.route('/bookings', bookingsRouter)
app.route('/activities', activitiesRouter)
app.route('/payments', paymentsRouter)
app.route('/reports', reportsRouter)
app.route('/staff', staffRouter)
app.route('/mobile', mobileRouter)
app.route('/mobile/staff', mobileStaffRouter)
app.route('/reviews', reviewsRouter)
app.route('/promo', promoRouter)
app.route('/housekeeping', housekeepingRouter)
app.route('/settings', settingsRouter)
app.route('/export', exportRouter)
app.route('/menu', menuRouter)
app.route('/vouchers', vouchersRouter)
app.route('/wishlist', wishlistRouter)
app.route('/notifications', notificationsRouter)
app.route('/pricing', pricingRouter)
app.route('/maintenance', maintenanceRouter)
app.route('/chat', chatRouter)
app.route('/trees', treesRouter)

// ── Reminder cron job — chạy mỗi ngày 08:00 ───────────────────────────────
async function sendCheckInReminders() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  const dayAfter = new Date(tomorrow)
  dayAfter.setDate(dayAfter.getDate() + 1)

  const bookings = await prisma.booking.findMany({
    where: {
      status: 'CONFIRMED',
      checkIn: { gte: tomorrow, lt: dayAfter },
    },
    include: {
      user: true,
      room: { include: { roomType: true } },
    },
  })

  for (const b of bookings) {
    if (!b.user.email) continue
    await sendBookingReminder({
      guestName: b.user.name,
      guestEmail: b.user.email,
      bookingCode: b.code,
      roomName: b.room?.roomType.name ?? 'Trầm Hương',
      roomNumber: b.room?.number ?? null,
      checkIn: b.checkIn.toISOString(),
      checkOut: b.checkOut.toISOString(),
      guests: b.guests,
    })
  }
  return bookings.length
}

// Schedule chạy lúc 8:00 sáng mỗi ngày
function scheduleDailyReminders() {
  const now = new Date()
  const next8am = new Date(now)
  next8am.setHours(8, 0, 0, 0)
  if (next8am <= now) next8am.setDate(next8am.getDate() + 1)
  const msUntil8am = next8am.getTime() - now.getTime()
  setTimeout(() => {
    sendCheckInReminders().catch(() => {})
    setInterval(() => sendCheckInReminders().catch(() => {}), 24 * 60 * 60 * 1000)
  }, msUntil8am)
}

// Admin endpoint để trigger thủ công
app.post('/api/admin/send-reminders', async (c) => {
  const count = await sendCheckInReminders()
  return c.json({ data: { sent: count, message: `Đã gửi ${count} email nhắc check-in ngày mai` } })
})

// 404
app.notFound((c) => c.json({ error: 'Not found' }, 404))

// Error handler
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

const PORT = Number(process.env['PORT'] ?? 4000)

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`API running at http://localhost:${PORT}`)
  scheduleDailyReminders()
})

export type AppType = typeof app
