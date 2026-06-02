import { Hono } from 'hono'
import { sign, verify } from 'hono/jwt'
import bcrypt from 'bcryptjs'
import { prisma } from '@tram-huong/database'

export const authRouter = new Hono()

const JWT_SECRET = process.env['AUTH_SECRET'] ?? 'local-dev-secret'

// POST /api/auth/admin/login
authRouter.post('/admin/login', async (c) => {
  const body = await c.req.json<{ email: string; password: string }>()

  if (!body.email || !body.password) {
    return c.json({ error: 'Cần có email và mật khẩu' }, 400)
  }

  const user = await prisma.user.findUnique({ where: { email: body.email } })

  if (!user || !user.passwordHash) {
    return c.json({ error: 'Email hoặc mật khẩu không đúng' }, 401)
  }

  if (!['ADMIN', 'MANAGER', 'STAFF'].includes(user.role)) {
    return c.json({ error: 'Không có quyền truy cập' }, 403)
  }

  const valid = await bcrypt.compare(body.password, user.passwordHash)
  if (!valid) {
    return c.json({ error: 'Email hoặc mật khẩu không đúng' }, 401)
  }

  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 ngày từ lúc login
  const token = await sign(
    { sub: user.id, role: user.role, exp },
    JWT_SECRET
  )

  return c.json({
    data: {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    },
  })
})

// GET /api/auth/admin/me
authRouter.get('/admin/me', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Chưa đăng nhập' }, 401)
  }

  try {
    const payload = await verify(authHeader.slice(7), JWT_SECRET, 'HS256')
    const user = await prisma.user.findUnique({
      where: { id: payload['sub'] as string },
      select: { id: true, name: true, email: true, role: true },
    })
    if (!user) return c.json({ error: 'Không tìm thấy user' }, 404)
    return c.json({ data: user })
  } catch {
    return c.json({ error: 'Token không hợp lệ' }, 401)
  }
})

// ─── Customer Auth ────────────────────────────────────────

// POST /api/auth/customer/register
authRouter.post('/customer/register', async (c) => {
  const body = await c.req.json<{ name: string; email: string; phone?: string; password: string }>()

  if (!body.name?.trim() || !body.email?.trim() || !body.password) {
    return c.json({ error: 'Vui lòng điền đầy đủ thông tin' }, 400)
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return c.json({ error: 'Email không hợp lệ' }, 400)
  }
  if (body.password.length < 6) {
    return c.json({ error: 'Mật khẩu tối thiểu 6 ký tự' }, 400)
  }

  const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } })
  if (existing) return c.json({ error: 'Email này đã được đăng ký' }, 409)

  const passwordHash = await bcrypt.hash(body.password, 10)
  const user = await prisma.user.create({
    data: {
      name: body.name.trim(),
      email: body.email.toLowerCase(),
      phone: body.phone?.trim() || null,
      role: 'GUEST',
      passwordHash,
    },
    select: { id: true, name: true, email: true, phone: true, role: true },
  })

  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 // 30 ngày
  const token = await sign({ sub: user.id, role: user.role, exp }, JWT_SECRET)
  return c.json({ data: { token, user } }, 201)
})

// POST /api/auth/customer/login
authRouter.post('/customer/login', async (c) => {
  const body = await c.req.json<{ email: string; password: string }>()

  if (!body.email || !body.password) {
    return c.json({ error: 'Vui lòng nhập email và mật khẩu' }, 400)
  }

  const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } })
  if (!user || !user.passwordHash) {
    return c.json({ error: 'Email hoặc mật khẩu không đúng' }, 401)
  }

  const valid = await bcrypt.compare(body.password, user.passwordHash)
  if (!valid) return c.json({ error: 'Email hoặc mật khẩu không đúng' }, 401)

  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30
  const token = await sign({ sub: user.id, role: user.role, exp }, JWT_SECRET)
  return c.json({
    data: {
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    },
  })
})

// GET /api/auth/customer/me
authRouter.get('/customer/me', async (c) => {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) return c.json({ error: 'Chưa đăng nhập' }, 401)
  try {
    const payload = await verify(header.slice(7), JWT_SECRET, 'HS256')
    const user = await prisma.user.findUnique({
      where: { id: payload['sub'] as string },
      select: { id: true, name: true, email: true, phone: true, role: true },
    })
    if (!user) return c.json({ error: 'Không tìm thấy tài khoản' }, 404)
    return c.json({ data: user })
  } catch {
    return c.json({ error: 'Token không hợp lệ' }, 401)
  }
})

// PATCH /api/auth/customer/me
authRouter.patch('/customer/me', async (c) => {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) return c.json({ error: 'Chưa đăng nhập' }, 401)
  try {
    const payload = await verify(header.slice(7), JWT_SECRET, 'HS256')
    const body = await c.req.json<{ name?: string; phone?: string; currentPassword?: string; newPassword?: string }>()

    const updateData: Record<string, unknown> = {}
    if (body.name?.trim()) updateData.name = body.name.trim()
    if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null

    if (body.newPassword) {
      if (body.newPassword.length < 6) return c.json({ error: 'Mật khẩu mới tối thiểu 6 ký tự' }, 400)
      const user = await prisma.user.findUnique({ where: { id: payload['sub'] as string } })
      if (!user?.passwordHash || !body.currentPassword) {
        return c.json({ error: 'Vui lòng nhập mật khẩu hiện tại' }, 400)
      }
      const valid = await bcrypt.compare(body.currentPassword, user.passwordHash)
      if (!valid) return c.json({ error: 'Mật khẩu hiện tại không đúng' }, 400)
      updateData.passwordHash = await bcrypt.hash(body.newPassword, 10)
    }

    const user = await prisma.user.update({
      where: { id: payload['sub'] as string },
      data: updateData,
      select: { id: true, name: true, email: true, phone: true, role: true },
    })
    return c.json({ data: user })
  } catch {
    return c.json({ error: 'Token không hợp lệ' }, 401)
  }
})

// POST /api/auth/customer/forgot-password
authRouter.post('/customer/forgot-password', async (c) => {
  const body = await c.req.json<{ email: string }>()
  // Luôn trả 200 để tránh email enumeration attack
  if (!body.email) return c.json({ success: true })

  const user = await prisma.user.findUnique({
    where: { email: body.email.toLowerCase() },
    select: { id: true, name: true, email: true },
  })

  if (user && user.email) {
    // TODO: Gửi email với link reset khi có domain thật
    // Hiện tại log để debug
    console.log(`[Auth] Password reset requested for: ${user.email}`)
    // Khi implement đầy đủ: tạo token, lưu DB, gửi email qua Resend
  }

  return c.json({ success: true })
})

// GET /api/auth/me (placeholder cũ)
authRouter.get('/me', (c) => c.json({ message: 'Dùng /api/auth/admin/me với Bearer token' }))
