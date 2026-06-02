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

// GET /api/auth/me (placeholder cũ)
authRouter.get('/me', (c) => c.json({ message: 'Dùng /api/auth/admin/me với Bearer token' }))
