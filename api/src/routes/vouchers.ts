import { Hono } from 'hono'
import { prisma } from '@tram-huong/database'

export const vouchersRouter = new Hono()

function generateVoucherCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'TV'
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

// GET /api/vouchers — admin: danh sách tất cả
vouchersRouter.get('/', async (c) => {
  const vouchers = await prisma.giftVoucher.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return c.json({ data: vouchers })
})

// POST /api/vouchers — tạo voucher (có thể kèm payment sau)
vouchersRouter.post('/', async (c) => {
  const body = await c.req.json<{
    value: number
    fromName: string
    fromEmail: string
    toName: string
    toEmail: string
    message?: string
    expiresAt?: string
  }>()
  if (!body.value || !body.fromName || !body.toName) {
    return c.json({ error: 'Thiếu value, fromName hoặc toName' }, 400)
  }

  const expiresAt = body.expiresAt
    ? new Date(body.expiresAt)
    : new Date(Date.now() + 365 * 86_400_000) // 1 năm mặc định

  const voucher = await prisma.giftVoucher.create({
    data: {
      code: generateVoucherCode(),
      value: body.value,
      fromName: body.fromName,
      fromEmail: body.fromEmail,
      toName: body.toName,
      toEmail: body.toEmail,
      message: body.message,
      expiresAt,
    },
  })
  return c.json({ data: voucher }, 201)
})

// GET /api/vouchers/check/:code — kiểm tra voucher (public)
vouchersRouter.get('/check/:code', async (c) => {
  const code = c.req.param('code').toUpperCase()
  const voucher = await prisma.giftVoucher.findUnique({ where: { code } })
  if (!voucher) return c.json({ error: 'Voucher không tồn tại' }, 404)
  if (voucher.status !== 'ACTIVE') return c.json({ error: `Voucher đã ${voucher.status === 'USED' ? 'được sử dụng' : 'hết hạn'}` }, 400)
  if (new Date(voucher.expiresAt) < new Date()) {
    await prisma.giftVoucher.update({ where: { code }, data: { status: 'EXPIRED' } })
    return c.json({ error: 'Voucher đã hết hạn' }, 400)
  }
  return c.json({
    data: {
      code: voucher.code,
      value: voucher.value,
      toName: voucher.toName,
      message: voucher.message,
      expiresAt: voucher.expiresAt,
    },
  })
})

// POST /api/vouchers/redeem — dùng voucher khi đặt phòng
vouchersRouter.post('/redeem', async (c) => {
  const { code, bookingId } = await c.req.json<{ code: string; bookingId: string }>()
  const voucher = await prisma.giftVoucher.findUnique({ where: { code: code.toUpperCase() } })
  if (!voucher || voucher.status !== 'ACTIVE') {
    return c.json({ error: 'Voucher không hợp lệ hoặc đã dùng' }, 400)
  }
  if (new Date(voucher.expiresAt) < new Date()) {
    return c.json({ error: 'Voucher đã hết hạn' }, 400)
  }

  await prisma.giftVoucher.update({
    where: { code: code.toUpperCase() },
    data: { status: 'USED', usedAt: new Date(), usedByBooking: bookingId },
  })

  return c.json({ data: { value: voucher.value, message: 'Voucher áp dụng thành công' } })
})

// DELETE /api/vouchers/:id — admin xóa
vouchersRouter.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await prisma.giftVoucher.delete({ where: { id } })
  return c.json({ ok: true })
})
