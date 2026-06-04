import { Hono } from 'hono'
import { prisma } from '@tram-huong/database'

export const exportRouter = new Hono()

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  const lines = [
    headers.join(','),
    ...rows.map(r => headers.map(h => escape(r[h])).join(',')),
  ]
  return lines.join('\r\n')
}

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('vi-VN')
}

function fmtMoney(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n)
}

// GET /api/export/bookings?from=&to=&status=
exportRouter.get('/bookings', async (c) => {
  const from = c.req.query('from')
  const to = c.req.query('to')
  const status = c.req.query('status')

  const bookings = await prisma.booking.findMany({
    where: {
      ...(from ? { checkIn: { gte: new Date(from) } } : {}),
      ...(to ? { checkOut: { lte: new Date(to) } } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      room: { include: { roomType: { select: { name: true } } } },
      payment: { select: { status: true, amount: true, method: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const rows = bookings.map(b => ({
    'Mã đặt phòng': b.code,
    'Khách hàng': b.user.name,
    'Email': b.user.email ?? '',
    'Điện thoại': b.user.phone ?? '',
    'Phòng': b.room?.number ?? '',
    'Loại phòng': b.room?.roomType?.name ?? '',
    'Check-in': fmtDate(b.checkIn),
    'Check-out': fmtDate(b.checkOut),
    'Số khách': b.guests,
    'Tổng tiền (VND)': fmtMoney(b.totalAmount),
    'Trạng thái booking': b.status,
    'Thanh toán': b.payment?.status ?? '',
    'PTTT': b.payment?.method ?? '',
    'Ghi chú': b.notes ?? '',
    'Ngày tạo': fmtDate(b.createdAt),
  }))

  const csv = toCSV(rows)
  c.header('Content-Type', 'text/csv; charset=utf-8')
  c.header('Content-Disposition', `attachment; filename="bookings_${Date.now()}.csv"`)
  return c.body('﻿' + csv) // BOM for Excel Vietnamese
})

// GET /api/export/revenue?days=30
exportRouter.get('/revenue', async (c) => {
  const days = parseInt(c.req.query('days') ?? '30', 10)
  const since = new Date(Date.now() - days * 86_400_000)

  const payments = await prisma.payment.findMany({
    where: { status: 'SUCCESS', paidAt: { gte: since } },
    include: {
      booking: {
        include: { room: { include: { roomType: { select: { name: true } } } } }
      },
    },
    orderBy: { paidAt: 'asc' },
  })

  const rows = payments.map(p => ({
    'Ngày thanh toán': fmtDate(p.paidAt),
    'Mã booking': p.booking.code,
    'Loại phòng': p.booking.room?.roomType?.name ?? '',
    'Số tiền (VND)': fmtMoney(p.amount),
    'PTTT': p.method,
    'Mã GD': p.transactionId ?? '',
  }))

  const csv = toCSV(rows)
  c.header('Content-Type', 'text/csv; charset=utf-8')
  c.header('Content-Disposition', `attachment; filename="revenue_${days}days_${Date.now()}.csv"`)
  return c.body('﻿' + csv)
})

// GET /api/export/housekeeping?date=YYYY-MM-DD
exportRouter.get('/housekeeping', async (c) => {
  const date = c.req.query('date')
  const start = date ? new Date(date) : new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setHours(23, 59, 59, 999)

  const tasks = await prisma.housekeepingTask.findMany({
    where: { scheduledFor: { gte: start, lte: end } },
    include: {
      room: { include: { roomType: { select: { name: true } } } },
      assignedTo: { select: { name: true } },
    },
    orderBy: { room: { number: 'asc' } },
  })

  const rows = tasks.map(t => ({
    'Phòng': t.room.number,
    'Loại phòng': t.room.roomType.name,
    'Loại task': t.type,
    'Ưu tiên': t.priority,
    'Nhân viên': t.assignedTo?.name ?? 'Chưa phân công',
    'Trạng thái': t.status,
    'Bắt đầu': fmtDate(t.startedAt),
    'Hoàn thành': fmtDate(t.completedAt),
    'Ghi chú': t.notes ?? '',
  }))

  const csv = toCSV(rows)
  c.header('Content-Type', 'text/csv; charset=utf-8')
  c.header('Content-Disposition', `attachment; filename="housekeeping_${Date.now()}.csv"`)
  return c.body('﻿' + csv)
})
