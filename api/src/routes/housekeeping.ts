import { Hono } from 'hono'
import { prisma } from '@tram-huong/database'

export const housekeepingRouter = new Hono()

// GET /api/housekeeping — danh sách task (filter by date, status, assignedTo)
housekeepingRouter.get('/', async (c) => {
  const date = c.req.query('date')       // YYYY-MM-DD
  const status = c.req.query('status')
  const assignedTo = c.req.query('assignedTo')
  const roomId = c.req.query('roomId')

  const start = date ? new Date(date) : new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setHours(23, 59, 59, 999)

  const tasks = await prisma.housekeepingTask.findMany({
    where: {
      scheduledFor: { gte: start, lte: end },
      ...(status ? { status } : {}),
      ...(assignedTo ? { assignedToId: assignedTo } : {}),
      ...(roomId ? { roomId } : {}),
    },
    include: {
      room: { include: { roomType: { select: { name: true } } } },
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: [{ priority: 'desc' }, { scheduledFor: 'asc' }],
  })
  return c.json({ data: tasks })
})

// POST /api/housekeeping — tạo task mới
housekeepingRouter.post('/', async (c) => {
  const body = await c.req.json<{
    roomId: string
    type?: string
    priority?: string
    assignedToId?: string
    notes?: string
    scheduledFor?: string
  }>()
  if (!body.roomId) return c.json({ error: 'Thiếu roomId' }, 400)

  const task = await prisma.housekeepingTask.create({
    data: {
      roomId: body.roomId,
      type: body.type ?? 'CHECKOUT',
      priority: body.priority ?? 'NORMAL',
      assignedToId: body.assignedToId ?? null,
      notes: body.notes ?? null,
      scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : new Date(),
    },
    include: {
      room: { include: { roomType: { select: { name: true } } } },
      assignedTo: { select: { id: true, name: true } },
    },
  })
  return c.json({ data: task }, 201)
})

// PATCH /api/housekeeping/:id — cập nhật trạng thái
housekeepingRouter.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{
    status?: string
    assignedToId?: string
    notes?: string
    priority?: string
  }>()

  const now = new Date()
  const task = await prisma.housekeepingTask.update({
    where: { id },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(body.assignedToId !== undefined ? { assignedToId: body.assignedToId } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
      ...(body.priority ? { priority: body.priority } : {}),
      ...(body.status === 'IN_PROGRESS' ? { startedAt: now } : {}),
      ...(body.status === 'DONE' ? { completedAt: now } : {}),
    },
    include: {
      room: { include: { roomType: { select: { name: true } } } },
      assignedTo: { select: { id: true, name: true } },
    },
  })
  return c.json({ data: task })
})

// DELETE /api/housekeeping/:id
housekeepingRouter.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await prisma.housekeepingTask.delete({ where: { id } })
  return c.json({ ok: true })
})

// GET /api/housekeeping/rooms-status — trạng thái dọn phòng tất cả rooms hôm nay
housekeepingRouter.get('/rooms-status', async (c) => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setHours(23, 59, 59, 999)

  const [rooms, tasks] = await Promise.all([
    prisma.room.findMany({
      include: { roomType: { select: { name: true } } },
      orderBy: [{ floor: 'asc' }, { number: 'asc' }],
    }),
    prisma.housekeepingTask.findMany({
      where: { scheduledFor: { gte: start, lte: end } },
      include: { assignedTo: { select: { name: true } } },
    }),
  ])

  const tasksByRoom = tasks.reduce<Record<string, typeof tasks>>((acc, t) => {
    if (!acc[t.roomId]) acc[t.roomId] = []
    acc[t.roomId]!.push(t)
    return acc
  }, {})

  return c.json({
    data: rooms.map(r => ({
      ...r,
      tasks: tasksByRoom[r.id] ?? [],
    })),
  })
})

// POST /api/housekeeping/auto-generate — tự tạo task checkout cho các phòng check-out hôm nay
housekeepingRouter.post('/auto-generate', async (c) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const checkouts = await prisma.booking.findMany({
    where: {
      checkOut: { gte: today, lt: tomorrow },
      status: { in: ['CHECKED_IN', 'COMPLETED'] },
    },
    include: { room: true },
  })

  const created = []
  for (const b of checkouts) {
    if (!b.roomId) continue
    const existing = await prisma.housekeepingTask.findFirst({
      where: { roomId: b.roomId, scheduledFor: { gte: today, lt: tomorrow }, type: 'CHECKOUT' },
    })
    if (existing) continue
    const t = await prisma.housekeepingTask.create({
      data: {
        roomId: b.roomId,
        type: 'CHECKOUT',
        priority: 'HIGH',
        scheduledFor: today,
      },
    })
    created.push(t)
  }
  return c.json({ data: created, count: created.length })
})
