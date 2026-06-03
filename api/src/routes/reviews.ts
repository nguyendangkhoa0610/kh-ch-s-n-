import { Hono } from 'hono'
import { prisma } from '@tram-huong/database'
import { verify } from 'hono/jwt'

export const reviewsRouter = new Hono()

const JWT_SECRET = process.env['AUTH_SECRET'] ?? 'local-dev-secret'

// GET /api/reviews — danh sách review đã duyệt (public)
reviewsRouter.get('/', async (c) => {
  const limit = Number(c.req.query('limit') ?? 10)
  const reviews = await prisma.review.findMany({
    where: { approved: true },
    orderBy: { createdAt: 'desc' },
    take: Math.min(limit, 50),
    select: { id: true, name: true, location: true, room: true, rating: true, text: true, createdAt: true },
  })
  return c.json({ data: reviews })
})

// GET /api/reviews/stats — thống kê (public)
reviewsRouter.get('/stats', async (c) => {
  const reviews = await prisma.review.findMany({
    where: { approved: true },
    select: { rating: true },
  })
  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0'
  return c.json({ data: { count: reviews.length, average: Number(avg) } })
})

// POST /api/reviews — submit review (public, chờ duyệt)
reviewsRouter.post('/', async (c) => {
  const body = await c.req.json<{
    name: string; location?: string; room?: string; rating: number; text: string
  }>()

  if (!body.name?.trim() || !body.text?.trim()) {
    return c.json({ error: 'Thiếu tên hoặc nội dung đánh giá' }, 400)
  }
  if (body.rating < 1 || body.rating > 5) {
    return c.json({ error: 'Rating phải từ 1 đến 5' }, 400)
  }
  if (body.text.trim().length < 20) {
    return c.json({ error: 'Đánh giá quá ngắn (tối thiểu 20 ký tự)' }, 400)
  }

  const review = await prisma.review.create({
    data: {
      name: body.name.trim(),
      location: body.location?.trim() || null,
      room: body.room?.trim() || null,
      rating: body.rating,
      text: body.text.trim(),
      approved: false,
    },
  })
  return c.json({ data: { id: review.id, message: 'Đánh giá đã được gửi, chờ kiểm duyệt.' } }, 201)
})

// GET /api/reviews/admin — tất cả review kể cả chưa duyệt (admin)
reviewsRouter.get('/admin', async (c) => {
  const header = c.req.header('Authorization') ?? ''
  if (!header.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const p = await verify(header.slice(7), JWT_SECRET, 'HS256') as { role: string }
    if (!['ADMIN', 'MANAGER'].includes(p.role)) return c.json({ error: 'Forbidden' }, 403)
  } catch { return c.json({ error: 'Unauthorized' }, 401) }

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return c.json({ data: reviews })
})

// PATCH /api/reviews/:id — admin approve/reject
reviewsRouter.patch('/:id', async (c) => {
  const header = c.req.header('Authorization') ?? ''
  if (!header.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const p = await verify(header.slice(7), JWT_SECRET, 'HS256') as { role: string }
    if (!['ADMIN', 'MANAGER'].includes(p.role)) return c.json({ error: 'Forbidden' }, 403)
  } catch { return c.json({ error: 'Unauthorized' }, 401) }

  const id = c.req.param('id')
  const { approved } = await c.req.json<{ approved: boolean }>()
  const review = await prisma.review.update({ where: { id }, data: { approved } })
  return c.json({ data: review })
})

// DELETE /api/reviews/:id — admin xóa
reviewsRouter.delete('/:id', async (c) => {
  const header = c.req.header('Authorization') ?? ''
  if (!header.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const p = await verify(header.slice(7), JWT_SECRET, 'HS256') as { role: string }
    if (!['ADMIN', 'MANAGER'].includes(p.role)) return c.json({ error: 'Forbidden' }, 403)
  } catch { return c.json({ error: 'Unauthorized' }, 401) }

  const id = c.req.param('id')
  await prisma.review.delete({ where: { id } })
  return c.json({ data: { success: true } })
})
