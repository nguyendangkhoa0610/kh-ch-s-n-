import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { prisma } from '@tram-huong/database'
import { getRealtimeSettings, updateRealtimeSettings, type CrowdLevel } from '../lib/realtime-store.js'

export const staffRouter = new Hono()

// ─── Staff list ───────────────────────────────────────────

staffRouter.get('/', async (c) => {
  const staff = await prisma.user.findMany({
    where: { role: { in: ['STAFF', 'MANAGER', 'ADMIN'] } },
    select: {
      id: true, name: true, email: true, phone: true, role: true,
      shifts: {
        where: { startTime: { gte: new Date(Date.now() - 7 * 86_400_000) } },
        orderBy: { startTime: 'asc' },
        take: 10,
      },
    },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  })
  return c.json({ data: staff })
})

// POST /api/staff
staffRouter.post('/', async (c) => {
  const body = await c.req.json<{
    name: string; email: string; phone?: string; role: string; password?: string
  }>()

  if (!body.name || !body.email) return c.json({ error: 'Thiếu tên hoặc email' }, 400)

  const existing = await prisma.user.findUnique({ where: { email: body.email } })
  if (existing) return c.json({ error: 'Email đã tồn tại' }, 409)

  const passwordHash = body.password
    ? await bcrypt.hash(body.password, 10)
    : await bcrypt.hash('TramHuong@2026', 10) // default password

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      phone: body.phone ?? null,
      role: body.role ?? 'STAFF',
      passwordHash,
    },
    select: { id: true, name: true, email: true, phone: true, role: true },
  })
  return c.json({ data: user }, 201)
})

// PATCH /api/staff/:id — chỉnh thông tin nhân viên
staffRouter.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{ name?: string; phone?: string; role?: string }>()
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.phone !== undefined && { phone: body.phone || null }),
      ...(body.role && { role: body.role }),
    },
    select: { id: true, name: true, email: true, phone: true, role: true },
  })
  return c.json({ data: user })
})

// PATCH /api/staff/:id/password — đặt lại mật khẩu
staffRouter.patch('/:id/password', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{ password: string }>()
  if (!body.password || body.password.length < 6) {
    return c.json({ error: 'Mật khẩu tối thiểu 6 ký tự' }, 400)
  }
  const passwordHash = await bcrypt.hash(body.password, 10)
  await prisma.user.update({ where: { id }, data: { passwordHash } })
  return c.json({ success: true })
})

// DELETE /api/staff/:id — xóa nhân viên
staffRouter.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return c.json({ error: 'Không tìm thấy' }, 404)
  if (user.role === 'ADMIN') return c.json({ error: 'Không thể xóa tài khoản Admin' }, 403)
  await prisma.user.delete({ where: { id } })
  return c.json({ success: true })
})

// ─── Shifts ───────────────────────────────────────────────

// GET /api/staff/shifts?from=&to=
staffRouter.get('/shifts', async (c) => {
  const from = c.req.query('from')
    ? new Date(c.req.query('from') as string)
    : new Date(Date.now() - 86_400_000) // yesterday

  const to = c.req.query('to')
    ? new Date(c.req.query('to') as string)
    : new Date(Date.now() + 7 * 86_400_000) // next 7 days

  const shifts = await prisma.shift.findMany({
    where: { startTime: { gte: from, lte: to } },
    include: { staff: { select: { id: true, name: true, role: true } } },
    orderBy: { startTime: 'asc' },
  })
  return c.json({ data: shifts })
})

// POST /api/staff/shifts
staffRouter.post('/shifts', async (c) => {
  const body = await c.req.json<{
    staffId: string; startTime: string; endTime: string; area: string; notes?: string
  }>()

  const shift = await prisma.shift.create({
    data: {
      staffId: body.staffId,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      area: body.area,
      notes: body.notes ?? null,
    },
    include: { staff: { select: { id: true, name: true } } },
  })
  return c.json({ data: shift }, 201)
})

// DELETE /api/staff/shifts/:id
staffRouter.delete('/shifts/:id', async (c) => {
  const id = c.req.param('id')
  await prisma.shift.delete({ where: { id } })
  return c.json({ success: true })
})

// ─── Real-time settings ───────────────────────────────────

staffRouter.get('/realtime', async (c) => {
  const data = await getRealtimeSettings()
  return c.json({ data })
})

staffRouter.patch('/realtime', async (c) => {
  const body = await c.req.json<{ crowdLevel?: CrowdLevel; notice?: string }>()
  const updated = await updateRealtimeSettings(body, 'admin')
  return c.json({ data: updated })
})
