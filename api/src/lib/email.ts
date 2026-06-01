import { Resend } from 'resend'
import QRCode from 'qrcode'

// Lazy init — tránh crash khi key chưa được set
function getResend(): Resend | null {
  const key = process.env['RESEND_API_KEY']
  if (!key || key === 're_your_key_here') return null
  return new Resend(key)
}

const FROM = process.env['RESEND_FROM'] ?? 'Trầm Hương Resort <onboarding@resend.dev>'

// ─── QR Code ─────────────────────────────────────────────

async function generateQR(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 200,
    color: { dark: '#064e3b', light: '#ffffff' },
  })
}

// ─── Format helpers ───────────────────────────────────────

function formatPrice(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function calcNights(checkIn: string, checkOut: string) {
  return Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000
  )
}

// ─── Email template ───────────────────────────────────────

function buildBookingEmail(params: {
  guestName: string
  bookingCode: string
  roomName: string
  roomNumber: string | null
  checkIn: string
  checkOut: string
  guests: number
  totalAmount: number
  qrDataUrl: string
}): { subject: string; html: string; text: string } {
  const { guestName, bookingCode, roomName, roomNumber, checkIn, checkOut, guests, totalAmount, qrDataUrl } = params
  const nights = calcNights(checkIn, checkOut)
  const deposit = Math.round(totalAmount * 0.3)
  const remaining = totalAmount - deposit

  const subject = `Xác nhận đặt phòng ${bookingCode} — Trầm Hương Eco-Resort`

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1e293b;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:#064e3b;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
          <p style="margin:0 0 4px;color:#6ee7b7;font-size:11px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;">
            Xác nhận đặt phòng
          </p>
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;font-family:Georgia,serif;">
            Trầm Hương Eco-Resort
          </h1>
          <p style="margin:8px 0 0;color:#a7f3d0;font-size:13px;">
            Bình Định · Việt Nam
          </p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:40px;">

          <p style="margin:0 0 24px;font-size:16px;color:#475569;line-height:1.6;">
            Xin chào <strong style="color:#0f172a;">${guestName}</strong>,
          </p>
          <p style="margin:0 0 32px;font-size:15px;color:#475569;line-height:1.6;">
            Đặt phòng của bạn đã được ghi nhận thành công. Vui lòng lưu mã QR
            bên dưới để check-in nhanh chóng khi đến resort.
          </p>

          <!-- QR Code -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
            <tr><td align="center" style="background:#f0fdf4;border-radius:16px;padding:28px;">
              <img src="${qrDataUrl}" width="160" height="160" alt="QR Check-in" style="display:block;border-radius:8px;" />
              <p style="margin:12px 0 0;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#6b7280;">
                Mã đặt phòng
              </p>
              <p style="margin:4px 0 0;font-size:22px;font-weight:800;font-family:'Courier New',monospace;color:#059669;letter-spacing:0.05em;">
                ${bookingCode}
              </p>
            </td></tr>
          </table>

          <!-- Booking details -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <tr><td style="background:#f8fafc;padding:14px 20px;border-bottom:1px solid #e2e8f0;">
              <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#6b7280;">
                Chi tiết đặt phòng
              </p>
            </td></tr>
            ${[
              ['Loại phòng', roomName],
              ['Số phòng', roomNumber ?? 'Sẽ được assign sớm'],
              ['Nhận phòng', formatDate(checkIn) + ' (từ 14:00)'],
              ['Trả phòng', formatDate(checkOut) + ' (trước 12:00)'],
              ['Thời gian', `${nights} đêm`],
              ['Số khách', `${guests} người`],
            ].map(([k, v], i) => `
            <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
              <td style="padding:12px 20px;font-size:13px;color:#6b7280;width:40%;">${k}</td>
              <td style="padding:12px 20px;font-size:13px;font-weight:600;color:#0f172a;">${v}</td>
            </tr>`).join('')}
          </table>

          <!-- Payment -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;background:#f0fdf4;border-radius:12px;overflow:hidden;">
            <tr><td style="padding:14px 20px;border-bottom:1px solid #d1fae5;">
              <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#047857;">
                Thông tin thanh toán
              </p>
            </td></tr>
            <tr><td style="padding:16px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:13px;color:#475569;padding-bottom:8px;">Tổng tiền phòng</td>
                  <td align="right" style="font-size:13px;color:#0f172a;font-weight:600;padding-bottom:8px;">${formatPrice(totalAmount)}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#475569;padding-bottom:8px;">Đặt cọc 30% (cần thanh toán)</td>
                  <td align="right" style="font-size:14px;color:#059669;font-weight:800;padding-bottom:8px;">${formatPrice(deposit)}</td>
                </tr>
                <tr style="border-top:1px solid #d1fae5;">
                  <td style="font-size:13px;color:#6b7280;padding-top:10px;">Còn lại khi check-in</td>
                  <td align="right" style="font-size:13px;color:#475569;font-weight:600;padding-top:10px;">${formatPrice(remaining)}</td>
                </tr>
              </table>
            </td></tr>
          </table>

          <!-- Policy -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;background:#fefce8;border:1px solid #fde68a;border-radius:12px;">
            <tr><td style="padding:16px 20px;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#92400e;">📋 Chính sách</p>
              <p style="margin:0;font-size:13px;color:#78350f;line-height:1.6;">
                • Hủy miễn phí trước 48h nhận phòng<br>
                • Đặt cọc không hoàn lại nếu hủy trong 24h<br>
                • Check-in từ 14:00, check-out trước 12:00
              </p>
            </td></tr>
          </table>

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
            <tr><td align="center">
              <a href="http://localhost:3000/dat-phong" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 36px;border-radius:9999px;">
                Xem chi tiết đặt phòng →
              </a>
            </td></tr>
          </table>

          <!-- Divider -->
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px;" />

          <!-- Footer -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:12px;color:#94a3b8;line-height:1.8;">
                <strong style="color:#475569;">Trầm Hương Eco-Resort</strong><br>
                Xã Cát Khánh, Phù Cát, Bình Định<br>
                📞 0256 xxx xxxx &nbsp;·&nbsp; ✉️ hello@tramhuong-resort.vn<br>
                <br>
                <span style="font-size:11px;">Email này được gửi tự động. Vui lòng không reply.</span>
              </td>
            </tr>
          </table>

        </td></tr>

        <!-- Footer bar -->
        <tr><td style="background:#064e3b;border-radius:0 0 16px 16px;padding:16px 40px;text-align:center;">
          <p style="margin:0;color:#6ee7b7;font-size:11px;">
            © 2026 Trầm Hương Eco-Resort · Hương của núi rừng, hồn của Bình Định
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`

  const text = `
Xác nhận đặt phòng — Trầm Hương Eco-Resort
===========================================

Xin chào ${guestName},

Đặt phòng của bạn đã được xác nhận!

MÃ ĐẶT PHÒNG: ${bookingCode}

CHI TIẾT:
- Phòng: ${roomName}${roomNumber ? ` (${roomNumber})` : ''}
- Nhận phòng: ${formatDate(checkIn)} từ 14:00
- Trả phòng: ${formatDate(checkOut)} trước 12:00
- Số đêm: ${nights}
- Số khách: ${guests}

THANH TOÁN:
- Tổng: ${formatPrice(totalAmount)}
- Đặt cọc 30%: ${formatPrice(deposit)}
- Còn lại khi check-in: ${formatPrice(remaining)}

CHÍNH SÁCH: Hủy miễn phí trước 48h nhận phòng.

Trầm Hương Eco-Resort
Xã Cát Khánh, Phù Cát, Bình Định
ĐT: 0256 xxx xxxx | Email: hello@tramhuong-resort.vn
`.trim()

  return { subject, html, text }
}

// ─── Public API ───────────────────────────────────────────

export type BookingEmailParams = {
  guestName: string
  guestEmail: string
  bookingCode: string
  roomName: string
  roomNumber: string | null
  checkIn: string
  checkOut: string
  guests: number
  totalAmount: number
}

export async function sendBookingConfirmation(params: BookingEmailParams): Promise<void> {
  const client = getResend()
  if (!client) {
    console.log('[Email] RESEND_API_KEY not set — skipping email send')
    console.log(`[Email] Would send to: ${params.guestEmail} (booking ${params.bookingCode})`)
    return
  }

  const qrDataUrl = await generateQR(params.bookingCode)
  const { subject, html, text } = buildBookingEmail({ ...params, qrDataUrl })

  const { error } = await client.emails.send({
    from: FROM,
    to: params.guestEmail,
    subject,
    html,
    text,
  })

  if (error) {
    console.error('[Email] Resend error:', error)
    // Không throw — email thất bại không nên block booking
  } else {
    console.log(`[Email] Sent booking confirmation to ${params.guestEmail}`)
  }
}
