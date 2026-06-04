import { Hono } from 'hono'
import { prisma } from '@tram-huong/database'

export const settingsRouter = new Hono()

const DEFAULT_SETTINGS: Record<string, string> = {
  'checkin_time': '14:00',
  'checkout_time': '12:00',
  'deposit_percent': '30',
  'cancel_full_refund_hours': '72',
  'cancel_half_refund_hours': '24',
  'max_guests_per_room': '4',
  'resort_name': 'Trầm Hương Eco-Resort',
  'resort_phone': '0256 123 4567',
  'resort_email': 'info@tramhuong.vn',
  'notice_banner': '',
  'crowd_level': 'LOW',
  'checkin_open': 'true',
}

// GET /api/settings — tất cả settings
settingsRouter.get('/', async (c) => {
  const rows = await prisma.setting.findMany()
  const map: Record<string, string> = { ...DEFAULT_SETTINGS }
  for (const r of rows) map[r.key] = r.value
  return c.json({ data: map })
})

// GET /api/settings/:key
settingsRouter.get('/:key', async (c) => {
  const key = c.req.param('key')
  const row = await prisma.setting.findUnique({ where: { key } })
  const value = row?.value ?? DEFAULT_SETTINGS[key] ?? null
  return c.json({ data: { key, value } })
})

// PUT /api/settings — bulk upsert { key: value, ... }
settingsRouter.put('/', async (c) => {
  const body = await c.req.json<Record<string, string>>()
  const updatedBy = c.req.header('X-Admin-Id') ?? 'admin'

  await Promise.all(
    Object.entries(body).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value, updatedBy },
        create: { key, value, updatedBy },
      })
    )
  )
  return c.json({ ok: true, updated: Object.keys(body).length })
})

// PUT /api/settings/:key
settingsRouter.put('/:key', async (c) => {
  const key = c.req.param('key')
  const { value } = await c.req.json<{ value: string }>()
  const updatedBy = c.req.header('X-Admin-Id') ?? 'admin'

  const row = await prisma.setting.upsert({
    where: { key },
    update: { value, updatedBy },
    create: { key, value, updatedBy },
  })
  return c.json({ data: row })
})
