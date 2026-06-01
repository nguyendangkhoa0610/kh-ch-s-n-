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

// Middleware
app.use('*', logger())
app.use('*', prettyJSON())
app.use(
  '*',
  cors({
    origin: (origin) => {
      const allowed = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8081']
      if (!origin || allowed.some((o) => origin.startsWith(o))) return origin ?? '*'
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
