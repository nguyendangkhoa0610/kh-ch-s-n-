import { Hono } from 'hono'
import { prisma } from '@tram-huong/database'

export const chatRouter = new Hono()

// POST /api/chat/sessions — bắt đầu phiên chat mới
chatRouter.post('/sessions', async (c) => {
  const { visitorName, visitorEmail } = await c.req.json<{
    visitorName: string; visitorEmail?: string
  }>()
  if (!visitorName?.trim()) return c.json({ error: 'Vui lòng nhập tên' }, 400)

  const session = await prisma.chatSession.create({
    data: { visitorName: visitorName.trim(), visitorEmail },
  })
  return c.json({ data: session }, 201)
})

// GET /api/chat/sessions/:id/messages — lấy tin nhắn trong session
chatRouter.get('/sessions/:id/messages', async (c) => {
  const id = c.req.param('id')
  const since = c.req.query('since') // ISO timestamp — chỉ lấy tin mới hơn

  const messages = await prisma.chatMessage.findMany({
    where: {
      sessionId: id,
      ...(since ? { createdAt: { gt: new Date(since) } } : {}),
    },
    orderBy: { createdAt: 'asc' },
  })
  return c.json({ data: messages })
})

// POST /api/chat/sessions/:id/messages — gửi tin (visitor hoặc staff)
chatRouter.post('/sessions/:id/messages', async (c) => {
  const sessionId = c.req.param('id')
  const { sender, senderName, content } = await c.req.json<{
    sender: 'visitor' | 'staff'; senderName: string; content: string
  }>()
  if (!content?.trim()) return c.json({ error: 'Nội dung không được trống' }, 400)

  const [message] = await prisma.$transaction([
    prisma.chatMessage.create({
      data: { sessionId, sender, senderName, content: content.trim() },
    }),
    prisma.chatSession.update({
      where: { id: sessionId },
      data: { lastMessageAt: new Date() },
    }),
  ])
  return c.json({ data: message }, 201)
})

// GET /api/chat/sessions — admin: tất cả sessions đang mở
chatRouter.get('/sessions', async (c) => {
  const status = c.req.query('status') ?? 'OPEN'
  const sessions = await prisma.chatSession.findMany({
    where: status === 'ALL' ? {} : { status },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      _count: { select: { messages: true } },
    },
    orderBy: { lastMessageAt: 'desc' },
  })
  return c.json({ data: sessions })
})

// PATCH /api/chat/sessions/:id — đóng session
chatRouter.patch('/sessions/:id', async (c) => {
  const id = c.req.param('id')
  const { status } = await c.req.json<{ status: string }>()
  const session = await prisma.chatSession.update({ where: { id }, data: { status } })
  return c.json({ data: session })
})
