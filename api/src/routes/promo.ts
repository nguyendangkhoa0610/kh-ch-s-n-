import { Hono } from 'hono'
import { prisma } from '@tram-huong/database'
import { verify } from 'hono/jwt'

export const promoRouter = new Hono()
const JWT_SECRET = process.env['AUTH_SECRET'] ?? 'local-dev-secret'

// POST /api/promo/validate — validate mã giảm giá (public)
promoRouter.post('/validate', async (c) => {
  const { code, amount } = await c.req.json<{ code: string; amount: number }>()

  if (!code?.trim()) return c.json({ error: 'Vui lòng nhập mã giảm giá' }, 400)

  const promo = await prisma.promoCode.findUnique({
    where: { code: code.trim().toUpperCase() },
  })

  if (!promo || !promo.active) return c.json({ error: 'Mã giảm giá không hợp lệ' }, 404)
  if (promo.expiresAt && new Date() > promo.expiresAt) return c.json({ error: 'Mã giảm giá đã hết hạn' }, 400)
  if (promo.usedCount >= promo.maxUses) return c.json({ error: 'Mã giảm giá đã hết lượt sử dụng' }, 400)

  const discount = Math.round(amount * promo.discountPercent / 100)
  const finalAmount = amount - discount

  return c.json({
    data: {
      valid: true,
      code: promo.code,
      discountPercent: promo.discountPercent,
      discount,
      finalAmount,
      description: promo.description,
    },
  })
})

// GET /api/promo/active — list mã đang active để khách xem (public)
promoRouter.get('/active', async (c) => {
  const now = new Date()
  const promos = await prisma.promoCode.findMany({
    where: { active: true },
    orderBy: { discountPercent: 'desc' },
    select: { code: true, discountPercent: true, description: true, expiresAt: true, maxUses: true, usedCount: true },
  })
  // Lọc mã còn hạn + còn lượt
  const available = promos
    .filter(p => (!p.expiresAt || p.expiresAt > now) && p.usedCount < p.maxUses)
    .map(p => ({ code: p.code, discountPercent: p.discountPercent, description: p.description, expiresAt: p.expiresAt }))
  return c.json({ data: available })
})

// POST /api/promo/use — đánh dấu đã dùng (gọi sau khi booking thành công)
promoRouter.post('/use', async (c) => {
  const { code } = await c.req.json<{ code: string }>()
  const promo = await prisma.promoCode.findUnique({ where: { code: code.toUpperCase() } })
  if (!promo) return c.json({ error: 'Không tìm thấy mã' }, 404)
  await prisma.promoCode.update({
    where: { id: promo.id },
    data: { usedCount: { increment: 1 } },
  })
  return c.json({ data: { success: true } })
})

// ── Admin routes ──────────────────────────────────────────────────────────────
async function adminAuth(c: any, next: any) {
  const header = c.req.header('Authorization') ?? ''
  if (!header.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const p = await verify(header.slice(7), JWT_SECRET, 'HS256') as { role: string }
    if (!['ADMIN', 'MANAGER'].includes(p.role)) return c.json({ error: 'Forbidden' }, 403)
    await next()
  } catch { return c.json({ error: 'Unauthorized' }, 401) }
}

// GET /api/promo — list tất cả promo codes (admin)
promoRouter.get('/', adminAuth, async (c) => {
  const promos = await prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } })
  return c.json({ data: promos })
})

// POST /api/promo — tạo mã mới (admin)
promoRouter.post('/', adminAuth, async (c) => {
  const body = await c.req.json<{
    code: string; discountPercent: number; maxUses?: number; expiresAt?: string; description?: string
  }>()

  if (!body.code?.trim()) return c.json({ error: 'Cần nhập mã' }, 400)
  if (body.discountPercent < 1 || body.discountPercent > 100) return c.json({ error: 'Discount phải 1-100%' }, 400)

  const promo = await prisma.promoCode.create({
    data: {
      code: body.code.trim().toUpperCase(),
      discountPercent: body.discountPercent,
      maxUses: body.maxUses ?? 100,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      description: body.description?.trim() || null,
    },
  })
  return c.json({ data: promo }, 201)
})

// PATCH /api/promo/:id — toggle active (admin)
promoRouter.patch('/:id', adminAuth, async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{ active?: boolean; maxUses?: number }>()
  const promo = await prisma.promoCode.update({ where: { id }, data: body })
  return c.json({ data: promo })
})

// DELETE /api/promo/:id (admin)
promoRouter.delete('/:id', adminAuth, async (c) => {
  await prisma.promoCode.delete({ where: { id: c.req.param('id') } })
  return c.json({ data: { success: true } })
})
