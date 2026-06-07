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
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [totalBookings, totalRevenue, rooms, recentBookings, completedBookings, todayCheckins, todayCheckouts, pendingBookings] = await Promise.all([
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
    prisma.booking.findMany({
      where: { status: 'COMPLETED' },
      select: { checkIn: true, checkOut: true, totalAmount: true },
    }),
    prisma.booking.count({
      where: { status: { in: ['CONFIRMED', 'CHECKED_IN'] }, checkIn: { gte: today, lt: tomorrow } },
    }),
    prisma.booking.count({
      where: { status: 'CHECKED_IN', checkOut: { gte: today, lt: tomorrow } },
    }),
    prisma.booking.count({ where: { status: 'PENDING' } }),
  ])

  const roomsOccupied = rooms.filter((r: { status: string }) => r.status === 'OCCUPIED').length
  const roomsTotal = rooms.length
  const occupancyRate = roomsTotal > 0 ? Math.round(roomsOccupied / roomsTotal * 100) : 0

  // ADR = tổng doanh thu completed / tổng số đêm completed
  const totalNights = completedBookings.reduce((sum: number, b: { checkIn: Date; checkOut: Date }) => {
    return sum + Math.ceil((b.checkOut.getTime() - b.checkIn.getTime()) / 86_400_000)
  }, 0)
  const completedRevenue = completedBookings.reduce((sum: number, b: { totalAmount: number }) => sum + b.totalAmount, 0)
  const adr = totalNights > 0 ? Math.round(completedRevenue / totalNights) : 0
  const revpar = Math.round(adr * occupancyRate / 100)

  return c.json({
    data: {
      totalBookings,
      totalRevenue: totalRevenue._sum.totalAmount ?? 0,
      roomsAvailable: rooms.filter((r: { status: string }) => r.status === 'AVAILABLE').length,
      roomsOccupied,
      roomsTotal,
      occupancyRate,
      adr,
      revpar,
      todayCheckins,
      todayCheckouts,
      pendingBookings,
      recentBookings,
    },
  })
})

// GET /api/reports/occupancy?days=30
reportsRouter.get('/occupancy', async (c) => {
  const days = Math.min(Number(c.req.query('days') ?? 30), 90)
  const roomsTotal = await prisma.room.count()

  const result: { date: string; label: string; occupiedRooms: number; totalRooms: number; occupancyRate: number }[] = []

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    const dEnd = new Date(d)
    dEnd.setDate(d.getDate() + 1)

    const occupiedRooms = await prisma.booking.count({
      where: {
        status: { in: ['CHECKED_IN', 'COMPLETED'] },
        checkIn: { lt: dEnd },
        checkOut: { gt: d },
      },
    })

    const dateStr = d.toISOString().split('T')[0] as string
    result.push({
      date: dateStr,
      label: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      occupiedRooms: Math.min(occupiedRooms, roomsTotal),
      totalRooms: roomsTotal,
      occupancyRate: roomsTotal > 0 ? Math.round(Math.min(occupiedRooms, roomsTotal) / roomsTotal * 100) : 0,
    })
  }

  return c.json({ data: result })
})
