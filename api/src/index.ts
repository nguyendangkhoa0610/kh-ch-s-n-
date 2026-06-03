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
})

export type AppType = typeof app
