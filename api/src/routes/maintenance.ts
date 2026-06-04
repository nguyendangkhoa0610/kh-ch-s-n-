import { Hono } from 'hono'
import { prisma } from '@tram-huong/database'

export const maintenanceRouter = new Hono()

// GET /api/maintenance — danh sách (admin)
maintenanceRouter.get('/', async (c) => {
  const status = c.req.query('status')
  const roomId = c.req.query('roomId')

  const reqs = await prisma.maintenanceRequest.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(roomId ? { roomId } : {}),
    },
    include: {
      room: { select: { number: true, floor: true, roomType: { select: { name: true } } } },
      reporter: { select: { name: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return c.json({ data: reqs })
})

// PATCH /api/maintenance/:id — cập nhật trạng thái (admin)
maintenanceRouter.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{ status?: string; priority?: string }>()

  const req = await prisma.maintenanceRequest.update({
    where: { id },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(body.priority ? { priority: body.priority } : {}),
      ...(body.status === 'RESOLVED' ? { resolvedAt: new Date() } : {}),
    },
    include: {
      room: { select: { number: true, roomType: { select: { name: true } } } },
      reporter: { select: { name: true } },
    },
  })
  return c.json({ data: req })
})

// DELETE /api/maintenance/:id
maintenanceRouter.delete('/:id', async (c) => {
  await prisma.maintenanceRequest.delete({ where: { id: c.req.param('id') } })
  return c.json({ ok: true })
})
