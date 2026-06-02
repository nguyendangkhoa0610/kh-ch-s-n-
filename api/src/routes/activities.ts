import { Hono } from 'hono'
import { prisma } from '@tram-huong/database'

export const activitiesRouter = new Hono()

// GET /api/activities (admin có thể xem all kể cả inactive)
activitiesRouter.get('/', async (c) => {
  const category = c.req.query('category')
  const all = c.req.query('all') === 'true'
  const activities = await prisma.activity.findMany({
    where: {
      ...(all ? {} : { isActive: true }),
      ...(category ? { category } : {}),
    },
    orderBy: { name: 'asc' },
  })
  return c.json({ data: activities })
})

// PATCH /api/activities/:id
activitiesRouter.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{
    isActive?: boolean; price?: number; maxSlots?: number
    name?: string; description?: string; duration?: number; category?: string; images?: string[]
  }>()
  const data: Record<string, unknown> = {}
  if (body.isActive !== undefined) data.isActive = body.isActive
  if (body.price !== undefined) data.price = Number(body.price)
  if (body.maxSlots !== undefined) data.maxSlots = Number(body.maxSlots)
  if (body.name !== undefined) data.name = body.name
  if (body.description !== undefined) data.description = body.description
  if (body.duration !== undefined) data.duration = Number(body.duration)
  if (body.category !== undefined) data.category = body.category
  if (body.images !== undefined) data.images = JSON.stringify(body.images)
  const activity = await prisma.activity.update({ where: { id }, data })
  return c.json({ data: activity })
})

// GET /api/activities/:slug
activitiesRouter.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  const activity = await prisma.activity.findUnique({
    where: { slug },
    include: {
      schedules: {
        where: { startTime: { gte: new Date() } },
        orderBy: { startTime: 'asc' },
      },
    },
  })
  if (!activity) return c.json({ error: 'Hoạt động không tồn tại' }, 404)
  return c.json({ data: activity })
})
