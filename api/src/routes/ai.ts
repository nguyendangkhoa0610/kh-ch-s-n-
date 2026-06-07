import { Hono } from 'hono'
import { prisma } from '@tram-huong/database'
import { verify } from 'hono/jwt'

const JWT_SECRET = process.env['AUTH_SECRET'] ?? 'local-dev-secret'

export const aiRouter = new Hono()

async function requireAdmin(c: any) {
  const header = c.req.header('Authorization') ?? ''
  if (!header.startsWith('Bearer ')) return false
  try {
    const p = await verify(header.slice(7), JWT_SECRET, 'HS256') as { role: string }
    return ['ADMIN', 'MANAGER'].includes(p.role)
  } catch { return false }
}

// ── POST /api/ai/feedback — khách gửi feedback cho câu trả lời AI ─────────
aiRouter.post('/feedback', async (c) => {
  const body = await c.req.json<{
    question: string
    aiAnswer: string
    isGood: boolean
    correction?: string
  }>()

  if (!body.question || !body.aiAnswer || body.isGood === undefined) {
    return c.json({ error: 'Thiếu dữ liệu' }, 400)
  }

  const feedback = await prisma.aiFeedback.create({
    data: {
      question: body.question,
      aiAnswer: body.aiAnswer,
      isGood: body.isGood,
      correction: body.correction?.trim() || null,
    },
  })

  return c.json({ data: feedback }, 201)
})

// ── GET /api/ai/feedback — admin xem danh sách feedback ───────────────────
aiRouter.get('/feedback', async (c) => {
  if (!await requireAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)

  const filter = c.req.query('filter') // 'good' | 'bad' | undefined
  const where = filter === 'good' ? { isGood: true }
    : filter === 'bad' ? { isGood: false }
    : undefined

  const feedback = await prisma.aiFeedback.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return c.json({ data: feedback })
})

// ── POST /api/ai/feedback/:id/add-to-kb — thêm feedback vào Knowledge Base
aiRouter.post('/feedback/:id/add-to-kb', async (c) => {
  if (!await requireAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)

  const id = c.req.param('id')
  const body = await c.req.json<{ title?: string; category?: string }>()

  const feedback = await prisma.aiFeedback.findUnique({ where: { id } })
  if (!feedback) return c.json({ error: 'Không tìm thấy feedback' }, 404)

  const content = feedback.correction ?? feedback.aiAnswer
  const entry = await prisma.knowledgeEntry.create({
    data: {
      title: body.title ?? feedback.question.slice(0, 80),
      content,
      category: body.category ?? 'FAQ',
      isActive: true,
    },
  })

  await prisma.aiFeedback.update({ where: { id }, data: { addedToKb: true } })

  return c.json({ data: entry }, 201)
})

// ── GET /api/ai/stats — thống kê cho admin ────────────────────────────────
aiRouter.get('/stats', async (c) => {
  if (!await requireAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)

  const [total, good, bad, addedToKb, kbCount] = await Promise.all([
    prisma.aiFeedback.count(),
    prisma.aiFeedback.count({ where: { isGood: true } }),
    prisma.aiFeedback.count({ where: { isGood: false } }),
    prisma.aiFeedback.count({ where: { addedToKb: true } }),
    prisma.knowledgeEntry.count({ where: { isActive: true } }),
  ])

  // Top 10 câu hỏi thường gặp (dựa trên similarity đơn giản — group by first 50 chars)
  const recent = await prisma.aiFeedback.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: { question: true, isGood: true },
  })

  return c.json({
    data: {
      total,
      good,
      bad,
      satisfactionRate: total > 0 ? Math.round((good / total) * 100) : 0,
      addedToKb,
      kbCount,
      recentQuestions: recent.slice(0, 20),
    },
  })
})

// ── GET /api/ai/knowledge — danh sách KB entries ──────────────────────────
aiRouter.get('/knowledge', async (c) => {
  if (!await requireAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)

  const entries = await prisma.knowledgeEntry.findMany({
    orderBy: { updatedAt: 'desc' },
  })

  return c.json({ data: entries })
})

// ── POST /api/ai/knowledge — tạo KB entry mới ─────────────────────────────
aiRouter.post('/knowledge', async (c) => {
  if (!await requireAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json<{
    title: string; content: string; category?: string
  }>()

  if (!body.title?.trim() || !body.content?.trim()) {
    return c.json({ error: 'Cần title và content' }, 400)
  }

  const entry = await prisma.knowledgeEntry.create({
    data: {
      title: body.title.trim(),
      content: body.content.trim(),
      category: body.category ?? 'FAQ',
      isActive: true,
    },
  })

  return c.json({ data: entry }, 201)
})

// ── PATCH /api/ai/knowledge/:id ───────────────────────────────────────────
aiRouter.patch('/knowledge/:id', async (c) => {
  if (!await requireAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)

  const id = c.req.param('id')
  const body = await c.req.json<{
    title?: string; content?: string; category?: string; isActive?: boolean
  }>()

  const entry = await prisma.knowledgeEntry.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.content !== undefined && { content: body.content }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  })

  return c.json({ data: entry })
})

// ── DELETE /api/ai/knowledge/:id ──────────────────────────────────────────
aiRouter.delete('/knowledge/:id', async (c) => {
  if (!await requireAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)

  const id = c.req.param('id')
  await prisma.knowledgeEntry.delete({ where: { id } })
  return c.json({ ok: true })
})

// ── GET /api/ai/knowledge/active — dùng cho RAG trong concierge ───────────
aiRouter.get('/knowledge/active', async (c) => {
  const entries = await prisma.knowledgeEntry.findMany({
    where: { isActive: true },
    select: { title: true, content: true, category: true },
    orderBy: { updatedAt: 'desc' },
  })
  return c.json({ data: entries })
})
