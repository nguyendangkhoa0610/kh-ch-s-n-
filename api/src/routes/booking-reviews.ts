import { Hono } from 'hono'
import { prisma } from '@tram-huong/database'
import { verify } from 'hono/jwt'

const JWT_SECRET = process.env['AUTH_SECRET'] ?? 'local-dev-secret'

async function getUser(authHeader: string | undefined) {
  if (!authHeader?.startsWith('Bearer ')) return null
  try {
    const p = await verify(authHeader.slice(7), JWT_SECRET, 'HS256')
    return p['sub'] as string
  } catch { return null }
}

export const bookingReviewsRouter = new Hono()

// GET /api/booking-reviews/:bookingCode — lấy review theo booking code (public)
bookingReviewsRouter.get('/:code', async (c) => {
  const code = c.req.param('code')
  const booking = await prisma.booking.findUnique({
    where: { code },
    include: { review: true },
  })
  if (!booking) return c.json({ error: 'Booking không tồn tại' }, 404)
  return c.json({ data: booking.review ?? null })
})

// POST /api/booking-reviews — gửi review sau khi checkout
bookingReviewsRouter.post('/', async (c) => {
  const userId = await getUser(c.req.header('Authorization'))
  if (!userId) return c.json({ error: 'Chưa đăng nhập' }, 401)

  const body = await c.req.json<{
    bookingCode: string
    overallRating: number
    cleanlinessRating?: number
    serviceRating?: number
    locationRating?: number
    comment?: string
  }>()

  if (!body.bookingCode || !body.overallRating) {
    return c.json({ error: 'Thiếu bookingCode hoặc overallRating' }, 400)
  }
  if (body.overallRating < 1 || body.overallRating > 5) {
    return c.json({ error: 'Rating phải từ 1–5' }, 400)
  }

  const booking = await prisma.booking.findFirst({
    where: { code: body.bookingCode, userId },
  })
  if (!booking) return c.json({ error: 'Booking không tồn tại hoặc không thuộc về bạn' }, 404)
  if (booking.status !== 'COMPLETED') {
    return c.json({ error: 'Chỉ có thể đánh giá sau khi checkout' }, 400)
  }

  const existing = await prisma.bookingReview.findUnique({ where: { bookingId: booking.id } })
  if (existing) return c.json({ error: 'Bạn đã gửi đánh giá cho booking này rồi' }, 409)

  const review = await prisma.bookingReview.create({
    data: {
      bookingId: booking.id,
      overallRating: body.overallRating,
      cleanlinessRating: body.cleanlinessRating ?? body.overallRating,
      serviceRating: body.serviceRating ?? body.overallRating,
      locationRating: body.locationRating ?? body.overallRating,
      comment: body.comment,
    },
  })
  return c.json({ data: review }, 201)
})

// GET /api/booking-reviews — admin: tất cả reviews
bookingReviewsRouter.get('/', async (c) => {
  const reviews = await prisma.bookingReview.findMany({
    include: {
      booking: {
        select: {
          code: true,
          checkIn: true,
          checkOut: true,
          user: { select: { name: true } },
          room: { select: { number: true, roomType: { select: { name: true } } } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  return c.json({ data: reviews })
})
