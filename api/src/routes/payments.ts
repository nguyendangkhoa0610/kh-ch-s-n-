import { Hono } from 'hono'
import { prisma } from '@tram-huong/database'
import { createPaymentUrl, verifyReturn, type VNPayReturnParams } from '../lib/vnpay.js'

export const paymentsRouter = new Hono()

// POST /api/payments/vnpay/create
// Tạo URL thanh toán VNPay cho một booking
paymentsRouter.post('/vnpay/create', async (c) => {
  const body = await c.req.json<{ bookingId: string }>()

  const booking = await prisma.booking.findUnique({
    where: { id: body.bookingId },
    include: { room: { include: { roomType: true } } },
  })

  if (!booking) return c.json({ error: 'Booking không tồn tại' }, 404)
  if (booking.status === 'CANCELLED') return c.json({ error: 'Booking đã hủy' }, 400)

  // Đặt cọc 30%
  const depositAmount = Math.round(booking.totalAmount * 0.3)

  // Lấy IP từ header
  const ipAddr =
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    '127.0.0.1'

  const roomName = booking.room?.roomType.name ?? 'Phòng Trầm Hương Resort'
  const orderInfo = `Dat coc 30% - ${booking.code} - ${roomName}`

  const paymentUrl = createPaymentUrl({
    bookingCode: booking.code,
    amount: depositAmount,
    orderInfo,
    ipAddr,
  })

  // Tạo Payment record ở trạng thái PENDING
  await prisma.payment.upsert({
    where: { bookingId: booking.id },
    update: { amount: depositAmount, method: 'VNPAY', status: 'PENDING' },
    create: {
      bookingId: booking.id,
      amount: depositAmount,
      method: 'VNPAY',
      status: 'PENDING',
    },
  })

  return c.json({
    data: {
      paymentUrl,
      depositAmount,
      bookingCode: booking.code,
    },
  })
})

// GET /api/payments/vnpay/ipn
// VNPay gọi IPN để xác nhận giao dịch (server-to-server)
paymentsRouter.get('/vnpay/ipn', async (c) => {
  const query = c.req.query() as VNPayReturnParams
  const result = verifyReturn(query)

  if (!result.valid) {
    return c.json({ RspCode: '97', Message: 'Invalid signature' })
  }

  const booking = await prisma.booking.findUnique({
    where: { code: result.bookingCode },
    include: { payment: true },
  })

  if (!booking) return c.json({ RspCode: '01', Message: 'Order not found' })

  if (booking.payment?.status === 'SUCCESS') {
    return c.json({ RspCode: '02', Message: 'Order already confirmed' })
  }

  if (booking.payment && booking.payment.amount !== result.amount) {
    return c.json({ RspCode: '04', Message: 'Invalid amount' })
  }

  if (result.success) {
    await prisma.$transaction([
      prisma.payment.update({
        where: { bookingId: booking.id },
        data: {
          status: 'SUCCESS',
          transactionId: query['vnp_TransactionNo'] ?? null,
          paidAt: new Date(),
        },
      }),
      prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'CONFIRMED' },
      }),
    ])
  } else {
    await prisma.payment.update({
      where: { bookingId: booking.id },
      data: { status: 'FAILED' },
    })
  }

  return c.json({ RspCode: '00', Message: 'Confirm Success' })
})

// GET /api/payments/vnpay/verify?vnp_...
// Web app gọi để xác minh kết quả sau khi VNPay redirect về
paymentsRouter.get('/vnpay/verify', async (c) => {
  const query = c.req.query() as VNPayReturnParams
  const result = verifyReturn(query)

  // Lấy thêm thông tin booking để hiển thị
  const booking = result.bookingCode
    ? await prisma.booking.findUnique({
        where: { code: result.bookingCode },
        include: {
          user: { select: { name: true, email: true } },
          room: { include: { roomType: true } },
          payment: true,
        },
      })
    : null

  return c.json({
    data: {
      ...result,
      booking,
    },
  })
})
