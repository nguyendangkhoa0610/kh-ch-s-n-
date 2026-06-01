import { Hono } from 'hono'
import { prisma } from '@tram-huong/database'

export const roomsRouter = new Hono()

// GET /api/rooms - danh sách phòng
roomsRouter.get('/', async (c) => {
  const rooms = await prisma.room.findMany({
    include: { roomType: true },
    orderBy: { number: 'asc' },
  })
  return c.json({ data: rooms })
})

// GET /api/rooms/types - loại phòng
roomsRouter.get('/types', async (c) => {
  const roomTypes = await prisma.roomType.findMany({
    include: { _count: { select: { rooms: true } } },
  })
  return c.json({ data: roomTypes })
})

// GET /api/rooms/:id
roomsRouter.get('/:id', async (c) => {
  const id = c.req.param('id')
  const room = await prisma.room.findUnique({
    where: { id },
    include: { roomType: true },
  })
  if (!room) return c.json({ error: 'Phòng không tồn tại' }, 404)
  return c.json({ data: room })
})

// PATCH /api/rooms/:id/status
roomsRouter.patch('/:id/status', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{ status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' }>()
  const room = await prisma.room.update({
    where: { id },
    data: { status: body.status },
  })
  return c.json({ data: room })
})
