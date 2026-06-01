import { Hono } from 'hono'
import { prisma } from '@tram-huong/database'

export const reportsRouter = new Hono()

// GET /api/reports/revenue?days=7
reportsRouter.get('/revenue', async (c) => {
  const days = Number(c.req.query('days') ?? 7)
  const since = new Date()
  since.setDate(since.getDate() - days)

  const bookings = await prisma.booking.findMany({
    where: {
      createdAt: { gte: since },
      status: { notIn: ['CANCELLED'] },
    },
    select: { createdAt: true, totalAmount: true, status: true },
    orderBy: { createdAt: 'asc' },
  })

  // Group by date
  const byDate: Record<string, { revenue: number; bookings: number }> = {}

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0] as string
    byDate[key] = { revenue: 0, bookings: 0 }
  }

  for (const b of bookings) {
    const key = b.createdAt.toISOString().split('T')[0] as string
    if (byDate[key]) {
      byDate[key].revenue += b.totalAmount
      byDate[key].bookings += 1
    }
  }

  const data = Object.entries(byDate).map(([date, v]) => ({
    date,
    label: new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    revenue: v.revenue,
    bookings: v.bookings,
  }))

  return c.json({ data })
})

// GET /api/reports/summary
reportsRouter.get('/summary', async (c) => {
  const [totalBookings, totalRevenue, rooms, recentBookings] = await Promise.all([
    prisma.booking.count({ where: { status: { notIn: ['CANCELLED'] } } }),
    prisma.booking.aggregate({
      where: { status: { notIn: ['CANCELLED'] } },
      _sum: { totalAmount: true },
    }),
    prisma.room.findMany({ select: { status: true } }),
    prisma.booking.findMany({
      where: { status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: { select: { name: true } },
        room: { include: { roomType: { select: { name: true } } } },
      },
    }),
  ])

  return c.json({
    data: {
      totalBookings,
      totalRevenue: totalRevenue._sum.totalAmount ?? 0,
      roomsAvailable: rooms.filter((r: { status: string }) => r.status === 'AVAILABLE').length,
      roomsOccupied: rooms.filter((r: { status: string }) => r.status === 'OCCUPIED').length,
      roomsTotal: rooms.length,
      recentBookings,
    },
  })
})
