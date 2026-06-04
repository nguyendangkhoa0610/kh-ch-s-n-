import { Hono } from 'hono'
import { prisma } from '@tram-huong/database'
import { verify } from 'hono/jwt'

const JWT_SECRET = process.env['AUTH_SECRET'] ?? 'local-dev-secret'

export const menuRouter = new Hono()

// GET /api/menu — tất cả menu items (public)
menuRouter.get('/', async (c) => {
  const category = c.req.query('category')
  const items = await prisma.menuItem.findMany({
    where: {
      isActive: true,
      ...(category ? { category } : {}),
    },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
  })
  return c.json({ data: items })
})

// GET /api/menu/all — admin: bao gồm inactive
menuRouter.get('/all', async (c) => {
  const items = await prisma.menuItem.findMany({
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  })
  return c.json({ data: items })
})

// POST /api/menu — admin tạo item
menuRouter.post('/', async (c) => {
  const body = await c.req.json<{
    name: string; nameEn?: string; description?: string
    category: string; price: number; image?: string
    isVeg?: boolean; sortOrder?: number
  }>()
  if (!body.name || !body.category || !body.price) {
    return c.json({ error: 'Thiếu name, category hoặc price' }, 400)
  }
  const item = await prisma.menuItem.create({
    data: {
      name: body.name,
      nameEn: body.nameEn,
      description: body.description,
      category: body.category,
      price: body.price,
      image: body.image,
      isVeg: body.isVeg ?? false,
      sortOrder: body.sortOrder ?? 0,
    },
  })
  return c.json({ data: item }, 201)
})

// PATCH /api/menu/:id
menuRouter.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<Partial<{
    name: string; nameEn: string; description: string
    category: string; price: number; image: string
    isActive: boolean; isVeg: boolean; sortOrder: number
  }>>()
  const item = await prisma.menuItem.update({ where: { id }, data: body })
  return c.json({ data: item })
})

// DELETE /api/menu/:id
menuRouter.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await prisma.menuItem.update({ where: { id }, data: { isActive: false } })
  return c.json({ ok: true })
})

// ─── Food Orders ───────────────────────────────────────────

// POST /api/menu/orders — khách đặt món
menuRouter.post('/orders', async (c) => {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) return c.json({ error: 'Chưa đăng nhập' }, 401)
  let userId: string
  try {
    const p = await verify(header.slice(7), JWT_SECRET, 'HS256')
    userId = p['sub'] as string
  } catch { return c.json({ error: 'Token không hợp lệ' }, 401) }

  const body = await c.req.json<{
    bookingId: string
    notes?: string
    items: { menuItemId: string; quantity: number; notes?: string }[]
  }>()
  if (!body.bookingId || !body.items?.length) {
    return c.json({ error: 'Thiếu bookingId hoặc items' }, 400)
  }

  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: body.items.map(i => i.menuItemId) } },
  })
  const priceMap = Object.fromEntries(menuItems.map(m => [m.id, m.price]))
  const totalAmount = body.items.reduce(
    (s, i) => s + (priceMap[i.menuItemId] ?? 0) * i.quantity, 0
  )

  const order = await prisma.foodOrder.create({
    data: {
      bookingId: body.bookingId,
      userId,
      totalAmount,
      notes: body.notes,
      items: {
        create: body.items.map(i => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          unitPrice: priceMap[i.menuItemId] ?? 0,
          notes: i.notes,
        })),
      },
    },
    include: { items: { include: { menuItem: true } } },
  })
  return c.json({ data: order }, 201)
})

// GET /api/menu/orders — admin xem tất cả orders (filter by status)
menuRouter.get('/orders', async (c) => {
  const status = c.req.query('status')
  const orders = await prisma.foodOrder.findMany({
    where: status ? { status } : {},
    include: {
      items: { include: { menuItem: true } },
      booking: { select: { code: true, room: { select: { number: true } } } },
      user: { select: { name: true, phone: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return c.json({ data: orders })
})

// GET /api/menu/orders/my — khách xem orders của mình
menuRouter.get('/orders/my', async (c) => {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) return c.json({ error: 'Chưa đăng nhập' }, 401)
  let userId: string
  try {
    const p = await verify(header.slice(7), JWT_SECRET, 'HS256')
    userId = p['sub'] as string
  } catch { return c.json({ error: 'Token không hợp lệ' }, 401) }

  const orders = await prisma.foodOrder.findMany({
    where: { userId },
    include: { items: { include: { menuItem: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return c.json({ data: orders })
})

// PATCH /api/menu/orders/:id — admin cập nhật trạng thái
menuRouter.patch('/orders/:id', async (c) => {
  const id = c.req.param('id')
  const { status } = await c.req.json<{ status: string }>()
  const order = await prisma.foodOrder.update({
    where: { id },
    data: {
      status,
      ...(status === 'DELIVERED' ? { deliveryTime: new Date() } : {}),
    },
  })
  return c.json({ data: order })
})
