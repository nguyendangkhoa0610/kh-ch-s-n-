import { Resend } from 'resend'
import QRCode from 'qrcode'

// Lazy init — tránh crash khi key chưa được set
function getResend(): Resend | null {
  const key = process.env['RESEND_API_KEY']
  if (!key || key === 're_your_key_here') return null
  return new Resend(key)
}

const FROM = process.env['RESEND_FROM'] ?? 'Trầm Hương Resort <onboarding@resend.dev>'
const SITE_URL = process.env['SITE_URL'] ?? 'https://tram-huong-web.vercel.app'
const ADMIN_EMAIL = process.env['ADMIN_NOTIFY_EMAIL'] ?? 'admin@tramhuong.vn'

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
              <a href="${SITE_URL}/dat-phong" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 36px;border-radius:9999px;">
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

export type AdminNotifyParams = BookingEmailParams & { guestPhone: string }

export async function sendAdminNotification(params: AdminNotifyParams): Promise<void> {
  const client = getResend()
  if (!client) return

  const nights = calcNights(params.checkIn, params.checkOut)
  const subject = `[Booking mới] ${params.bookingCode} — ${params.guestName}`

  const html = `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <tr><td style="background:#1e3a5f;border-radius:16px 16px 0 0;padding:24px 36px;">
          <p style="margin:0 0 2px;color:#93c5fd;font-size:11px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;">Admin Alert</p>
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">🏨 Booking mới — Trầm Hương</h1>
        </td></tr>

        <tr><td style="background:#ffffff;padding:32px 36px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:24px;">
            <tr><td style="background:#f8fafc;padding:12px 18px;border-bottom:1px solid #e2e8f0;">
              <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#6b7280;">Thông tin booking</p>
            </td></tr>
            ${[
              ['Mã booking', `<strong style="font-family:monospace;color:#059669;font-size:15px;">${params.bookingCode}</strong>`],
              ['Khách', `${params.guestName} — ${params.guestPhone}`],
              ['Email', params.guestEmail],
              ['Phòng', params.roomName + (params.roomNumber ? ` (${params.roomNumber})` : '')],
              ['Nhận phòng', formatDate(params.checkIn)],
              ['Trả phòng', formatDate(params.checkOut)],
              ['Số đêm', `${nights} đêm · ${params.guests} khách`],
              ['Tổng tiền', `<strong style="color:#059669;">${formatPrice(params.totalAmount)}</strong>`],
            ].map(([k, v], i) => `
            <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
              <td style="padding:11px 18px;font-size:13px;color:#6b7280;width:38%;">${k}</td>
              <td style="padding:11px 18px;font-size:13px;color:#0f172a;">${v}</td>
            </tr>`).join('')}
          </table>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${SITE_URL.replace('tram-huong-web', 'tram-huong-admin')}/bookings"
                style="display:inline-block;background:#1e3a5f;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;padding:12px 28px;border-radius:9999px;">
                Xem trong Admin Dashboard →
              </a>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="background:#1e3a5f;border-radius:0 0 16px 16px;padding:14px 36px;text-align:center;">
          <p style="margin:0;color:#93c5fd;font-size:11px;">Trầm Hương Eco-Resort · Hệ thống quản lý</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  const { error } = await client.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject,
    html,
  })

  if (error) {
    console.error('[Email] Admin notify error:', error)
  } else {
    console.log(`[Email] Admin notified: ${params.bookingCode}`)
  }
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

// ─── Booking Reminder Email (24h trước check-in) ─────────

export type ReminderParams = {
  guestName: string
  guestEmail: string
  bookingCode: string
  roomName: string
  roomNumber: string | null
  checkIn: string
  checkOut: string
  guests: number
}

export async function sendBookingReminder(params: ReminderParams): Promise<void> {
  const client = getResend()

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })

  if (!client) {
    console.log(`[Email] Reminder skipped (no Resend key): ${params.guestEmail} — ${params.bookingCode}`)
    return
  }

  const confirmUrl = `${SITE_URL}/dat-phong/xac-nhan/${params.bookingCode}`
  const mapUrl = `${SITE_URL}/ban-do`

  await client.emails.send({
    from: FROM,
    to: params.guestEmail,
    subject: `🌿 Nhắc nhở check-in ngày mai — ${params.bookingCode}`,
    html: `
      <div style="font-family:'Be Vietnam Pro',sans-serif;max-width:560px;margin:auto;background:#f8fafc;padding:24px">
        <div style="background:#064e3b;border-radius:16px;padding:24px;text-align:center;margin-bottom:20px">
          <h1 style="color:#fff;font-family:Georgia,serif;font-size:28px;margin:0 0 8px">Trầm Hương Eco-Resort</h1>
          <p style="color:#86b59a;font-size:13px;margin:0">Bình Định · Việt Nam</p>
        </div>

        <div style="background:#fff;border-radius:12px;padding:24px;margin-bottom:16px">
          <h2 style="color:#064e3b;font-size:20px;margin:0 0 16px">Xin chào ${params.guestName}! 👋</h2>
          <p style="color:#374151;font-size:15px">Ngày mai là ngày check-in của bạn tại Trầm Hương. Chúng tôi đang rất mong đón bạn!</p>

          <div style="background:#f0fdf4;border-left:4px solid #059669;border-radius:8px;padding:16px;margin:20px 0">
            <p style="margin:0 0 8px;font-size:13px;color:#6b7280">Mã đặt phòng</p>
            <p style="font-family:monospace;font-size:22px;font-weight:700;color:#059669;margin:0">${params.bookingCode}</p>
          </div>

          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:6px 0;color:#6b7280">Phòng</td><td style="padding:6px 0;font-weight:600;color:#111827">${params.roomName}${params.roomNumber ? ` · Số ${params.roomNumber}` : ''}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Check-in</td><td style="padding:6px 0;font-weight:600;color:#111827">${formatDate(params.checkIn)} · 14:00</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Check-out</td><td style="padding:6px 0;font-weight:600;color:#111827">${formatDate(params.checkOut)} · 12:00</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Số khách</td><td style="padding:6px 0;font-weight:600;color:#111827">${params.guests} người</td></tr>
          </table>
        </div>

        <div style="background:#fff;border-radius:12px;padding:20px;margin-bottom:16px">
          <h3 style="color:#111827;font-size:16px;margin:0 0 12px">📋 Chuẩn bị cho chuyến đi</h3>
          <ul style="color:#374151;font-size:14px;padding-left:20px;margin:0;line-height:1.8">
            <li>Mang theo CMND/CCCD để làm thủ tục check-in</li>
            <li>Đưa đón miễn phí từ Sân bay Phù Cát (báo trước giờ bay)</li>
            <li>Bữa sáng phục vụ 06:30–09:30 tại Nhà hàng Trầm</li>
            <li>WiFi: TramHuong_Resort — Mật khẩu: tramhuong2026</li>
          </ul>
        </div>

        <div style="text-align:center;margin-bottom:16px">
          <a href="${confirmUrl}" style="display:inline-block;background:#059669;color:white;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:700;font-size:15px;margin-right:8px">
            🎫 Xem vé đặt phòng
          </a>
          <a href="${mapUrl}" style="display:inline-block;background:#f3f4f6;color:#374151;padding:14px 24px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px">
            🗺️ Bản đồ resort
          </a>
        </div>

        <div style="text-align:center;color:#9ca3af;font-size:12px">
          <p>Cần hỗ trợ? Gọi lễ tân <strong>0932 183 605</strong> (24/7)</p>
          <p>Trầm Hương Eco-Resort · Xã Cát Khánh, Phù Cát, Bình Định</p>
        </div>
      </div>
    `,
  }).catch(() => { /* fail silently */ })
}

// ─── Review Invite Email (sau checkout) ──────────────────

export type ReviewInviteParams = {
  guestName: string
  guestEmail: string
  bookingCode: string
  roomName: string
  nights: number
}

export async function sendReviewInvite(params: ReviewInviteParams): Promise<void> {
  const client = getResend()
  if (!client) {
    console.log(`[Email] Review invite skipped: ${params.guestEmail} (${params.bookingCode})`)
    return
  }

  const reviewUrl = `${SITE_URL}/dat-phong/danh-gia/${params.bookingCode}`

  await client.emails.send({
    from: FROM,
    to: params.guestEmail,
    subject: `Cảm ơn bạn đã lưu trú tại Trầm Hương 🌿 — Chia sẻ trải nghiệm của bạn`,
    html: `
      <div style="font-family:'Be Vietnam Pro',sans-serif;max-width:560px;margin:auto;background:#f8fafc;padding:24px">
        <div style="background:linear-gradient(135deg,#064e3b,#047857);border-radius:16px;padding:32px;text-align:center;margin-bottom:20px">
          <p style="color:#6ee7b7;font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 8px">Cảm ơn bạn</p>
          <h1 style="color:#ffffff;font-family:Georgia,serif;font-size:28px;margin:0 0 8px">Trầm Hương Eco-Resort</h1>
          <p style="color:#a7f3d0;font-size:14px;margin:0">Hẹn gặp lại bạn lần sau! 🌿</p>
        </div>

        <div style="background:#ffffff;border-radius:12px;padding:28px;margin-bottom:16px">
          <h2 style="color:#0f172a;font-size:20px;margin:0 0 12px">Xin chào ${params.guestName} 👋</h2>
          <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 16px">
            Cảm ơn bạn đã chọn <strong>Trầm Hương Eco-Resort</strong> cho kỳ nghỉ ${params.nights} đêm vừa rồi.
            Hy vọng bạn đã có những khoảnh khắc thư giãn tuyệt vời bên thiên nhiên Bình Định!
          </p>
          <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px">
            Ý kiến của bạn giúp chúng tôi cải thiện dịch vụ cho những vị khách tiếp theo.
            Chỉ cần <strong>1 phút</strong> để đánh giá trải nghiệm của bạn nhé!
          </p>

          <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center">
            <p style="color:#6b7280;font-size:12px;margin:0 0 4px">Mã đặt phòng</p>
            <p style="font-family:monospace;font-size:20px;font-weight:700;color:#059669;margin:0">${params.bookingCode}</p>
            <p style="color:#6b7280;font-size:13px;margin:6px 0 0">${params.roomName}</p>
          </div>

          <div style="text-align:center">
            <a href="${reviewUrl}" style="display:inline-block;background:#059669;color:white;padding:16px 40px;border-radius:999px;text-decoration:none;font-weight:700;font-size:16px">
              ⭐ Đánh giá ngay
            </a>
          </div>
        </div>

        <div style="text-align:center;color:#9ca3af;font-size:12px;line-height:1.8">
          <p>Muốn đặt phòng lần sau? <a href="${SITE_URL}/dat-phong" style="color:#059669;text-decoration:none;font-weight:600">Đặt ngay tại đây →</a></p>
          <p>Trầm Hương Eco-Resort · Xã Cát Khánh, Phù Cát, Bình Định</p>
        </div>
      </div>
    `,
  }).catch(() => { /* fail silently */ })
}
