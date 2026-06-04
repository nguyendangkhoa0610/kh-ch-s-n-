import { Hono } from 'hono'
import { prisma } from '@tram-huong/database'
import { verify } from 'hono/jwt'

const JWT_SECRET = process.env['AUTH_SECRET'] ?? 'local-dev-secret'

export const wishlistRouter = new Hono()

async function getUser(c: any): Promise<string | null> {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) return null
  try {
    const p = await verify(header.slice(7), JWT_SECRET, 'HS256')
    return p['sub'] as string
  } catch { return null }
}

// GET /api/wishlist — lấy wishlist của user
wishlistRouter.get('/', async (c) => {
  const userId = await getUser(c)
  if (!userId) return c.json({ error: 'Chưa đăng nhập' }, 401)

  const items = await prisma.wishlist.findMany({
    where: { userId },
    include: {
      roomType: {
        select: { id: true, name: true, slug: true, basePrice: true, images: true, tagline: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  return c.json({ data: items })
})

// POST /api/wishlist — thêm vào wishlist
wishlistRouter.post('/', async (c) => {
  const userId = await getUser(c)
  if (!userId) return c.json({ error: 'Chưa đăng nhập' }, 401)
  const { roomTypeId } = await c.req.json<{ roomTypeId: string }>()
  if (!roomTypeId) return c.json({ error: 'Thiếu roomTypeId' }, 400)

  const item = await prisma.wishlist.upsert({
    where: { userId_roomTypeId: { userId, roomTypeId } },
    update: {},
    create: { userId, roomTypeId },
  })
  return c.json({ data: item }, 201)
})

// DELETE /api/wishlist/:roomTypeId — xóa khỏi wishlist
wishlistRouter.delete('/:roomTypeId', async (c) => {
  const userId = await getUser(c)
  if (!userId) return c.json({ error: 'Chưa đăng nhập' }, 401)
  const roomTypeId = c.req.param('roomTypeId')

  await prisma.wishlist.deleteMany({ where: { userId, roomTypeId } })
  return c.json({ ok: true })
})

// GET /api/wishlist/check/:roomTypeId — check nhanh có trong wishlist không
wishlistRouter.get('/check/:roomTypeId', async (c) => {
  const userId = await getUser(c)
  if (!userId) return c.json({ data: { inWishlist: false } })
  const roomTypeId = c.req.param('roomTypeId')

  const item = await prisma.wishlist.findUnique({
    where: { userId_roomTypeId: { userId, roomTypeId } },
  })
  return c.json({ data: { inWishlist: !!item } })
})
