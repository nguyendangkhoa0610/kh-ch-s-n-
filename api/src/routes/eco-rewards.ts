import { Hono } from 'hono'
import { prisma } from '@tram-huong/database'

export const ecoRewardsRouter = new Hono()

// GET /api/eco-rewards — admin list all rewards
ecoRewardsRouter.get('/', async (c) => {
  const rewards = await prisma.ecoReward.findMany({
    orderBy: { pointCost: 'asc' },
  })
  return c.json({ data: rewards })
})

// POST /api/eco-rewards — admin create reward
ecoRewardsRouter.post('/', async (c) => {
  const body = await c.req.json() as {
    title: string; description?: string; pointCost: number
    type: string; value: number; stock?: number
  }
  const reward = await prisma.ecoReward.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      pointCost: body.pointCost,
      type: body.type,
      value: body.value,
      stock: body.stock ?? -1,
    },
  })
  return c.json({ data: reward })
})

// PATCH /api/eco-rewards/:id — admin update (isActive, stock, etc.)
ecoRewardsRouter.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json() as Partial<{ title: string; description: string; pointCost: number; type: string; value: number; isActive: boolean; stock: number }>
  const reward = await prisma.ecoReward.update({ where: { id }, data: body })
  return c.json({ data: reward })
})

// DELETE /api/eco-rewards/:id — admin delete
ecoRewardsRouter.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await prisma.ecoReward.delete({ where: { id } })
  return c.json({ data: { ok: true } })
})
