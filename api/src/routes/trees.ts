import { Hono } from 'hono'
import { prisma } from '@tram-huong/database'

export const treesRouter = new Hono()

// GET /api/trees — danh sách tất cả cây (admin)
treesRouter.get('/', async (c) => {
  const trees = await prisma.treeInfo.findMany({ orderBy: { name: 'asc' } })
  return c.json({ data: trees })
})

// GET /api/trees/:qrCode — lấy thông tin cây theo QR code (public — app scan)
treesRouter.get('/:qrCode', async (c) => {
  const qrCode = c.req.param('qrCode')
  const tree = await prisma.treeInfo.findUnique({ where: { qrCode } })
  if (!tree || !tree.isActive) return c.json({ error: 'Không tìm thấy cây' }, 404)
  return c.json({ data: tree })
})

// POST /api/trees — admin tạo cây mới
treesRouter.post('/', async (c) => {
  const body = await c.req.json<{
    qrCode: string; name: string; scientificName?: string
    age?: number; height?: number; description: string
    ecoValue: string; story?: string; imageUrl?: string; location?: string
  }>()
  if (!body.qrCode || !body.name || !body.description) {
    return c.json({ error: 'Thiếu qrCode, name hoặc description' }, 400)
  }
  const tree = await prisma.treeInfo.create({ data: body })
  return c.json({ data: tree }, 201)
})

// PATCH /api/trees/:id — admin sửa
treesRouter.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const tree = await prisma.treeInfo.update({ where: { id }, data: body })
  return c.json({ data: tree })
})

// DELETE /api/trees/:id
treesRouter.delete('/:id', async (c) => {
  await prisma.treeInfo.update({ where: { id: c.req.param('id') }, data: { isActive: false } })
  return c.json({ ok: true })
})
