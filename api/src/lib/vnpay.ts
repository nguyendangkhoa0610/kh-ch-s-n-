import crypto from 'crypto'

// ─── Config ───────────────────────────────────────────────

export const VNPAY_CONFIG = {
  tmnCode: process.env['VNPAY_TMN_CODE'] ?? 'DEMO',
  hashSecret: process.env['VNPAY_HASH_SECRET'] ?? 'RAOEXHYVSDDIIENL',
  url: process.env['VNPAY_URL'] ?? 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  returnUrl: process.env['VNPAY_RETURN_URL'] ?? 'http://localhost:3000/dat-phong/ket-qua',
  version: '2.1.0',
  command: 'pay',
  currCode: 'VND',
  locale: 'vn',
  orderType: 'other',
}

// ─── Helpers ──────────────────────────────────────────────

function formatDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  )
}

function hmacSHA512(key: string, data: string): string {
  return crypto.createHmac('sha512', key).update(data, 'utf-8').digest('hex')
}

function sortParams(params: Record<string, string>): string {
  return Object.keys(params)
    .filter((k) => params[k] !== '' && params[k] !== undefined)
    .sort()
    .map((k) => `${k}=${encodeURIComponent(params[k] ?? '').replace(/%20/g, '+')}`)
    .join('&')
}

// ─── Build payment URL ────────────────────────────────────

export type CreatePaymentParams = {
  bookingCode: string
  amount: number   // VND — already the actual amount (not ×100 yet)
  orderInfo: string
  ipAddr: string
}

export function createPaymentUrl(params: CreatePaymentParams): string {
  const now = new Date()

  const vnpParams: Record<string, string> = {
    vnp_Version: VNPAY_CONFIG.version,
    vnp_Command: VNPAY_CONFIG.command,
    vnp_TmnCode: VNPAY_CONFIG.tmnCode,
    vnp_Amount: String(params.amount * 100),  // VNPay requires amount × 100
    vnp_CurrCode: VNPAY_CONFIG.currCode,
    vnp_TxnRef: params.bookingCode,
    vnp_OrderInfo: params.orderInfo,
    vnp_OrderType: VNPAY_CONFIG.orderType,
    vnp_Locale: VNPAY_CONFIG.locale,
    vnp_ReturnUrl: VNPAY_CONFIG.returnUrl,
    vnp_IpAddr: params.ipAddr,
    vnp_CreateDate: formatDate(now),
  }

  const signData = sortParams(vnpParams)
  const secureHash = hmacSHA512(VNPAY_CONFIG.hashSecret, signData)

  return `${VNPAY_CONFIG.url}?${signData}&vnp_SecureHash=${secureHash}`
}

// ─── Verify return / IPN ──────────────────────────────────

export type VNPayReturnParams = Record<string, string>

export function verifyReturn(query: VNPayReturnParams): {
  valid: boolean
  success: boolean
  bookingCode: string
  amount: number
  message: string
} {
  const { vnp_SecureHash, vnp_ResponseCode, vnp_TxnRef, vnp_Amount, ...rest } = query

  // Rebuild params without hash fields
  const paramsToSign: Record<string, string> = {}
  for (const [k, v] of Object.entries(rest)) {
    if (k.startsWith('vnp_') && k !== 'vnp_SecureHashType') {
      paramsToSign[k] = v
    }
  }

  const signData = sortParams(paramsToSign)
  const expectedHash = hmacSHA512(VNPAY_CONFIG.hashSecret, signData)
  const valid = expectedHash === vnp_SecureHash

  const responseMessages: Record<string, string> = {
    '00': 'Giao dịch thành công',
    '07': 'Trừ tiền thành công - giao dịch bị nghi ngờ',
    '09': 'Thẻ/TK chưa đăng ký dịch vụ',
    '10': 'Xác thực thẻ/TK thất bại quá 3 lần',
    '11': 'Đã hết hạn chờ thanh toán',
    '12': 'Thẻ/TK bị khóa',
    '13': 'Sai mật khẩu OTP',
    '24': 'Khách hàng hủy giao dịch',
    '51': 'Số dư không đủ',
    '65': 'Vượt hạn mức giao dịch trong ngày',
    '75': 'Ngân hàng đang bảo trì',
    '79': 'Sai mật khẩu thanh toán quá số lần quy định',
    '99': 'Lỗi không xác định',
  }

  const code = vnp_ResponseCode ?? '99'
  return {
    valid,
    success: valid && code === '00',
    bookingCode: vnp_TxnRef ?? '',
    amount: Math.round(Number(vnp_Amount ?? 0) / 100),
    message: responseMessages[code] ?? `Mã lỗi: ${code}`,
  }
}
