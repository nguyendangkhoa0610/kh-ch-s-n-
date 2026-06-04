import { Hono } from 'hono'
import { prisma } from '@tram-huong/database'

export const pricingRouter = new Hono()

// GET /api/pricing — tất cả seasonal prices
pricingRouter.get('/', async (c) => {
  const prices = await prisma.seasonalPrice.findMany({
    include: { roomType: { select: { name: true, slug: true, basePrice: true } } },
    orderBy: { startDate: 'asc' },
  })
  return c.json({ data: prices })
})

// GET /api/pricing/active — giá hiệu lực ngay hôm nay
pricingRouter.get('/active', async (c) => {
  const now = new Date()
  const prices = await prisma.seasonalPrice.findMany({
    where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
    include: { roomType: { select: { name: true, slug: true, basePrice: true } } },
  })
  return c.json({ data: prices })
})

// GET /api/pricing/for-room/:roomTypeId?date=YYYY-MM-DD — giá của 1 phòng tại ngày cụ thể
pricingRouter.get('/for-room/:roomTypeId', async (c) => {
  const roomTypeId = c.req.param('roomTypeId')
  const dateStr = c.req.query('date')
  const date = dateStr ? new Date(dateStr) : new Date()

  const roomType = await prisma.roomType.findUnique({ where: { id: roomTypeId } })
  if (!roomType) return c.json({ error: 'Không tìm thấy loại phòng' }, 404)

  const seasonalPrice = await prisma.seasonalPrice.findFirst({
    where: {
      roomTypeId,
      isActive: true,
      startDate: { lte: date },
      endDate: { gte: date },
    },
    orderBy: { createdAt: 'desc' },
  })

  const finalPrice = seasonalPrice
    ? seasonalPrice.fixedPrice ?? Math.round(roomType.basePrice * seasonalPrice.priceMultiplier)
    : roomType.basePrice

  return c.json({
    data: {
      basePrice: roomType.basePrice,
      finalPrice,
      multiplier: seasonalPrice?.priceMultiplier ?? 1,
      seasonName: seasonalPrice?.name ?? null,
    },
  })
})

// POST /api/pricing — tạo seasonal price
pricingRouter.post('/', async (c) => {
  const body = await c.req.json<{
    roomTypeId: string; name: string
    startDate: string; endDate: string
    priceMultiplier?: number; fixedPrice?: number
  }>()
  if (!body.roomTypeId || !body.name || !body.startDate || !body.endDate) {
    return c.json({ error: 'Thiếu thông tin' }, 400)
  }
  const price = await prisma.seasonalPrice.create({
    data: {
      roomTypeId: body.roomTypeId,
      name: body.name,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      priceMultiplier: body.priceMultiplier ?? 1.0,
      fixedPrice: body.fixedPrice ?? null,
    },
    include: { roomType: { select: { name: true } } },
  })
  return c.json({ data: price }, 201)
})

// PATCH /api/pricing/:id
pricingRouter.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<Partial<{
    name: string; startDate: string; endDate: string
    priceMultiplier: number; fixedPrice: number | null; isActive: boolean
  }>>()
  const price = await prisma.seasonalPrice.update({
    where: { id },
    data: {
      ...body,
      ...(body.startDate ? { startDate: new Date(body.startDate) } : {}),
      ...(body.endDate ? { endDate: new Date(body.endDate) } : {}),
    },
  })
  return c.json({ data: price })
})

// DELETE /api/pricing/:id
pricingRouter.delete('/:id', async (c) => {
  await prisma.seasonalPrice.delete({ where: { id: c.req.param('id') } })
  return c.json({ ok: true })
})
