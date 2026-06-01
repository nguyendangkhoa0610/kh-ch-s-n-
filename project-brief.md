




# 🌿 TRẦM HƯƠNG ECO-RESORT — PROJECT BRIEF

> Tài liệu chính thức của dự án. Mọi quyết định kiến trúc, tính năng, lộ trình đều ghi trong file này. Cập nhật khi có thay đổi.

**Phiên bản:** 1.0 · **Ngày tạo:** 31/05/2026 · **Tác giả:** Solo Developer

---

## 1. 📌 Tổng quan dự án

### 1.1 Thông tin cơ bản
- **Tên thương hiệu:** Trầm Hương Eco-Resort
- **Địa điểm:** Bình Định, Việt Nam
- **Loại hình:** Khu nghỉ dưỡng sinh thái cao cấp
- **Định vị:** Trung-cao cấp, gần gũi thiên nhiên, ứng dụng công nghệ
- **Đối tượng khách:** Gia đình trẻ, cặp đôi, du khách yêu thiên nhiên, đoàn nghỉ dưỡng

### 1.2 Mục tiêu dự án
Xây dựng hệ thống số hoá toàn diện cho resort gồm:
1. **Website khách hàng** — Brand presence, đặt phòng trực tiếp
2. **Mobile App khách** — Digital room key, AI concierge, AR, one-bill
3. **Admin Web** — Quản lý vận hành toàn resort
4. **Staff Mobile App** — Quét QR, SOS alerts, ca trực

### 1.3 Tính chất kinh doanh
- Resort thật, có khách thật
- Solo developer (10h/tuần)
- Deadline mở (làm chậm mà chắc)
- Ngân sách: tiết kiệm tối đa (free tier ưu tiên)

---

## 2. 🎨 Thương hiệu & Định vị

### 2.1 Giá trị cốt lõi
- **Tinh tế** — phong cách Việt Nam trang trọng nhưng không xa cách
- **Gần gũi** — thân thiện với gia đình, không "kén khách"
- **Bền vững** — tôn trọng tự nhiên, eco-friendly thực sự
- **Hiện đại** — công nghệ phục vụ trải nghiệm

### 2.2 Tone of voice (giọng văn)
- Ấm áp, lịch sự, không sến súa
- Dùng tiếng Việt chuẩn, có chiều sâu (lấy cảm hứng từ trầm hương — quý mà không phô)
- Tránh từ Anh không cần thiết
- Câu ngắn gọn, dễ đọc trên mobile

### 2.3 Slogan tham khảo
- "Trầm Hương — Hương của núi rừng, hồn của Bình Định"
- "Lưu giữ thanh âm thiên nhiên"
- "Nơi trầm tích trở thành kỷ niệm"

---

## 3. 🎨 Design System

### 3.1 Bảng màu

```css
/* Primary — Emerald (xanh ngọc lục bảo) */
--emerald-50:  #ecfdf5;
--emerald-500: #10b981;
--emerald-600: #059669;
--emerald-700: #047857;
--emerald-900: #064e3b;

/* Accent — Sunshine Yellow */
--amber-300: #fcd34d;
--amber-400: #fbbf24;
--amber-500: #f59e0b;

/* Secondary — Lime (xanh lá mạ) */
--lime-300: #bef264;
--lime-400: #a3e635;
--lime-500: #84cc16;

/* Wood — Trầm hương (nâu trầm) */
--wood-600: #92400e;
--wood-800: #78350f;

/* Neutrals */
--cream:    #fefce8;
--ivory:    #fffbeb;
--slate-50: #f8fafc;
--slate-900:#0f172a;
```

**Quy tắc dùng màu:**
- Background chủ đạo: cream/ivory (ấm, không trắng lạnh)
- Primary action: emerald-600
- Highlight/CTA: amber-400
- Văn bản chính: slate-900
- Văn bản phụ: slate-600

### 3.2 Typography

```
Headings: 'Lora', serif    — Elegant, có chiều sâu lịch sử
Body:     'Be Vietnam Pro' — Sans-serif, dễ đọc tiếng Việt
Display:  'Lora', serif    — Cho hero titles
Mono:     'JetBrains Mono' — Cho code/QR
```

**Quy tắc:**
- Heading 1: 48-72px, semibold, line-height 1.1
- Heading 2: 32-48px, semibold
- Body: 16-18px, regular
- Caption: 13-14px, medium

### 3.3 Style nguyên tắc

- **3D isometric tươi sáng** cho illustration (resort, map icons)
- **Glassmorphism nhẹ** cho cards quan trọng (backdrop-blur, bg trắng/10)
- **Smooth animations cao cấp** lấy cảm hứng từ Reverie:
  - Scroll-linked parallax (mouse + scroll)
  - Hardware-accelerated transforms (translate3d)
  - Easing cubic-bezier(0.4, 0, 0.2, 1)
- **Rounded corners** — 12px (md), 24px (lg), 9999px (full)
- **Shadows** mềm, không gắt — `0 8px 32px rgba(0,0,0,0.08)`

### 3.4 Spacing scale
4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128 (px)

### 3.5 Iconography
- **Lucide Icons** cho UI (consistent stroke-width 1.5)
- **Custom SVG** cho map markers (3D-style, đầy đủ màu)
- **Heroicons** dự phòng

---

## 4. 🏗️ Kiến trúc kỹ thuật

### 4.1 Tech Stack chính thức

| Layer | Công nghệ | Lý do |
|---|---|---|
| **Web (Customer)** | Next.js 15 (App Router) + TypeScript | SEO, SSG/SSR, Vercel deploy dễ |
| **Web (Admin)** | Vite + React 19 + TypeScript | Internal tool, không cần SEO, build nhanh |
| **Mobile** | Expo SDK 52 + React Native | iOS + Android một codebase, có NFC |
| **API** | Hono on Node.js 22 | Lightweight, edge-ready, type-safe |
| **Database** | PostgreSQL 16 + Prisma 6 | Relations mạnh, type-safe queries |
| **Auth** | Better Auth | Modern, type-safe, framework-agnostic |
| **Styling** | Tailwind CSS v4 | Utility-first, dễ maintain |
| **UI Components** | shadcn/ui (customized) | Copy-paste, no dependency hell |
| **State (Web)** | Zustand + TanStack Query | Đơn giản, mạnh |
| **State (Mobile)** | Zustand + TanStack Query | Consistent với web |
| **Realtime** | Pusher Channels | SOS alerts, crowd updates |
| **Payment** | VNPay + MoMo + ZaloPay | Khách Việt Nam |
| **File Storage** | Cloudinary | Free tier rộng, có transform |
| **Email** | Resend | Modern API, free tier |
| **SMS** | Speedsms.vn | OTP cho VN |
| **Maps** | Mapbox GL JS | Custom style đẹp, 50k loads free |
| **Analytics** | Vercel Analytics + Umami | Privacy-friendly |
| **Error tracking** | Sentry (free tier) | Production debugging |

### 4.2 Monorepo

```
Tool: Turborepo + pnpm workspaces
Lý do: Build cache mạnh, chia sẻ code dễ
```

### 4.3 Cấu trúc thư mục

```
tram-huong-resort/
├── apps/
│   ├── web/                    # Next.js — Website khách hàng
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── public/
│   ├── admin/                  # Vite — Admin dashboard
│   │   ├── src/
│   │   └── public/
│   └── mobile/                 # Expo — App khách + staff
│       ├── app/                # File-based routing
│       └── components/
│
├── packages/
│   ├── ui/                     # Components dùng chung (Button, Card...)
│   ├── database/               # Prisma schema + client
│   ├── api-client/             # Type-safe API client (Hono RPC)
│   ├── shared/                 # Types, utils, constants
│   └── config/                 # ESLint, TS, Tailwind configs
│
├── api/                        # Hono backend
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── lib/
│   └── prisma/
│
├── docs/                       # Tài liệu
│   ├── PROJECT_BRIEF.md        # ← File này
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   └── API.md
│
├── .github/
│   └── workflows/              # CI/CD
├── turbo.json
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

---

## 5. 🗄️ Database Schema (phase 1 — core)

```prisma
// Người dùng (khách + admin + staff)
model User {
  id          String   @id @default(cuid())
  email       String?  @unique
  phone       String?  @unique
  name        String
  avatar      String?
  role        Role     @default(GUEST)  // GUEST, STAFF, MANAGER, ADMIN
  passwordHash String?
  
  bookings    Booking[]
  shifts      Shift[]
  alerts      SOSAlert[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Loại phòng
model RoomType {
  id          String   @id @default(cuid())
  name        String   // "Bungalow View Biển", "Nhà sàn Rừng"
  slug        String   @unique
  description String   @db.Text
  basePrice   Int      // VND per night
  capacity    Int      // số khách tối đa
  size        Int      // m²
  amenities   String[] // ["wifi", "ac", "pool_view"]
  images      String[] // Cloudinary URLs
  
  rooms       Room[]
}

// Phòng cụ thể
model Room {
  id          String   @id @default(cuid())
  number      String   @unique  // "B01", "S05"
  roomTypeId  String
  roomType    RoomType @relation(fields: [roomTypeId], references: [id])
  status      RoomStatus @default(AVAILABLE) // AVAILABLE, OCCUPIED, MAINTENANCE
  
  bookings    Booking[]
}

// Đặt phòng
model Booking {
  id          String   @id @default(cuid())
  code        String   @unique  // "TH202605001"
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  roomId      String?
  room        Room?    @relation(fields: [roomId], references: [id])
  
  checkIn     DateTime
  checkOut    DateTime
  guests      Int
  
  totalAmount Int
  status      BookingStatus @default(PENDING) // PENDING, CONFIRMED, CHECKED_IN, COMPLETED, CANCELLED
  
  payment     Payment?
  activities  ActivityBooking[]
  digitalKey  DigitalKey?
  
  notes       String?  @db.Text
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Hoạt động (chèo SUP, đốt lửa trại, spa...)
model Activity {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String   @db.Text
  price       Int      // 0 = miễn phí
  duration    Int      // phút
  maxSlots    Int
  category    String   // "water", "land", "wellness", "food"
  images      String[]
  
  schedules   ActivitySchedule[]
}

model ActivitySchedule {
  id          String   @id @default(cuid())
  activityId  String
  activity    Activity @relation(fields: [activityId], references: [id])
  startTime   DateTime
  bookedSlots Int      @default(0)
  
  bookings    ActivityBooking[]
}

model ActivityBooking {
  id          String   @id @default(cuid())
  bookingId   String
  booking     Booking  @relation(fields: [bookingId], references: [id])
  scheduleId  String
  schedule    ActivitySchedule @relation(fields: [scheduleId], references: [id])
  guests      Int
}

// Thanh toán
model Payment {
  id          String   @id @default(cuid())
  bookingId   String   @unique
  booking     Booking  @relation(fields: [bookingId], references: [id])
  amount      Int
  method      PaymentMethod  // VNPAY, MOMO, ZALOPAY, CASH
  status      PaymentStatus  // PENDING, SUCCESS, FAILED, REFUNDED
  transactionId String?
  paidAt      DateTime?
}

// Digital Room Key
model DigitalKey {
  id          String   @id @default(cuid())
  bookingId   String   @unique
  booking     Booking  @relation(fields: [bookingId], references: [id])
  token       String   @unique  // JWT for door lock
  qrCode      String
  validFrom   DateTime
  validUntil  DateTime
  revokedAt   DateTime?
  
  unlockLogs  UnlockLog[]
}

model UnlockLog {
  id          String   @id @default(cuid())
  keyId       String
  key         DigitalKey @relation(fields: [keyId], references: [id])
  unlockedAt  DateTime @default(now())
  doorId      String
}

// SOS Alerts từ vòng tay / app
model SOSAlert {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  type        AlertType  // SOS, INCIDENT, REQUEST
  location    Json       // { lat, lng, area }
  message     String?
  status      AlertStatus @default(NEW)  // NEW, RESPONDING, RESOLVED
  respondedBy String?
  respondedAt DateTime?
  createdAt   DateTime @default(now())
}

// Ca làm việc của nhân viên
model Shift {
  id          String   @id @default(cuid())
  staffId     String
  staff       User     @relation(fields: [staffId], references: [id])
  startTime   DateTime
  endTime     DateTime
  area        String   // "reception", "beach", "kitchen"
  notes       String?
}

// Enums
enum Role { GUEST STAFF MANAGER ADMIN }
enum RoomStatus { AVAILABLE OCCUPIED MAINTENANCE }
enum BookingStatus { PENDING CONFIRMED CHECKED_IN COMPLETED CANCELLED }
enum PaymentMethod { VNPAY MOMO ZALOPAY CASH }
enum PaymentStatus { PENDING SUCCESS FAILED REFUNDED }
enum AlertType { SOS INCIDENT REQUEST }
enum AlertStatus { NEW RESPONDING RESOLVED }
```

---

## 6. 🚀 Tính năng theo Phase

### PHASE 1 — Nền móng (Tuần 1-2, ~20h)
- [ ] Setup Turborepo + pnpm
- [ ] Setup Next.js (web) với Tailwind v4 + TS
- [ ] Setup Vite (admin) với Tailwind + TS
- [ ] Setup Expo (mobile)
- [ ] Setup Hono API + Prisma
- [ ] Database schema phase 1 (User, Room, Booking)
- [ ] Auth flow (email + phone OTP) với Better Auth
- [ ] Deploy CI/CD ban đầu (Vercel + Railway)

### PHASE 2 — Website Khách hàng (Tuần 3-6, ~40h)
- [ ] **Hero Section** — 3D isometric panorama + parallax cao cấp
- [ ] **Navigation** — Sticky header, responsive
- [ ] **Trang Giới thiệu** — Câu chuyện thương hiệu, gallery
- [ ] **Trang Phòng** — List + filter + chi tiết phòng
- [ ] **Bản đồ tương tác** — Mapbox với custom markers (WC, y tế, nước, F&B)
- [ ] **Trang Hoạt động** — Liệt kê activities + lịch
- [ ] **Trang Lập lịch trình AI** — Form dropdown → kế hoạch tối ưu
- [ ] **Thanh real-time** — Weather API + crowd level + events hôm nay
- [ ] **Booking flow** — Chọn ngày → chọn phòng → thông tin → thanh toán
- [ ] **Tích hợp VNPay** (đặt cọc 30%)
- [ ] **Email xác nhận** với mã QR vé
- [ ] **SEO setup** — sitemap, OG tags, schema.org

### PHASE 3 — Admin Web (Tuần 7-9, ~30h)
- [ ] **Login admin** với 2FA
- [ ] **Dashboard** — KPI cards, biểu đồ doanh thu, chiếm dụng phòng
- [ ] **Quản lý Booking** — list + filter + xác nhận + check-in/out
- [ ] **Quản lý Phòng** — trạng thái phòng, bảo trì
- [ ] **Quản lý Hoạt động** — thêm/sửa lịch, slot
- [ ] **Cập nhật Real-time** — đăng thời tiết, crowd level, events
- [ ] **Báo cáo** — doanh thu theo ngày/tuần/tháng, export Excel
- [ ] **Quản lý nhân viên** — danh sách, phân quyền, ca trực

### PHASE 4 — Mobile App Khách (Tuần 10-15, ~60h)
- [ ] **Splash + Onboarding**
- [ ] **Login** (cùng auth với web)
- [ ] **Home Screen** — vé hiện tại, hoạt động hôm nay, weather
- [ ] **🔑 Digital Room Key** — NFC tap + QR backup
- [ ] **🤖 AI Concierge** — chatbox với LLM (Claude/Gemini API)
- [ ] **🏠 Smart Room Control** — đèn, máy lạnh, rèm (mock IoT lúc đầu)
- [ ] **💳 One Bill** — view tab toàn resort
- [ ] **🌱 Eco-Challenge** — danh sách thử thách, điểm xanh
- [ ] **🥽 AR Discovery** — đơn giản hoá: scan QR cây → thông tin
- [ ] **🎬 Sen Vàng Memory** — gallery ảnh + video kỷ niệm chuyến đi
- [ ] **🆘 Nút SOS** — gửi alert với GPS

### PHASE 5 — Staff App (Tuần 16-17, ~20h)
- [ ] **Login staff**
- [ ] **Home** — ca trực hôm nay, nhiệm vụ
- [ ] **QR Scanner** — quét check-in khách
- [ ] **🆘 SOS Alert feed** — nhận realtime alerts với GPS map
- [ ] **Báo cáo sự cố** — chụp ảnh + mô tả + gửi
- [ ] **Tin nhắn nội bộ** — chat theo tổ

### PHASE 6 — Polish & Launch (Tuần 18-20, ~30h)
- [ ] Mobile responsive hoàn hảo (mọi breakpoints)
- [ ] Performance optimization (Lighthouse 90+)
- [ ] Accessibility (a11y) cơ bản
- [ ] Content tiếng Anh (i18n cho khách quốc tế)
- [ ] Testing E2E các flow quan trọng
- [ ] Backup & disaster recovery plan
- [ ] Mua domain, SSL, deploy production
- [ ] Launch! 🚀

**TỔNG CỘNG ƯỚC TÍNH: ~200 giờ ≈ 20 tuần (5 tháng) với 10h/tuần**

> ⚠️ **Lưu ý thực tế**: Solo dev thường bị chậm 1.5-2x so với estimate. Realistic 7-10 tháng.

---

## 7. 📐 Quy ước Code

### 7.1 TypeScript
- **strict: true** trong mọi tsconfig
- Không dùng `any` — dùng `unknown` rồi narrow
- Type return value của function public
- Prefer `type` hơn `interface` trừ khi cần `extends`

### 7.2 Naming
- **Files:** `kebab-case.tsx` (component), `camelCase.ts` (util)
- **Components:** `PascalCase`
- **Functions:** `camelCase`, verb-first (`getUserById`, `formatPrice`)
- **Constants:** `SCREAMING_SNAKE_CASE`
- **Types:** `PascalCase`, không prefix `I`

### 7.3 Component structure
```tsx
// 1. Imports (sorted: React → external → internal → relative)
// 2. Types
// 3. Constants
// 4. Component
// 5. Sub-components (nếu có)
// 6. Default export
```

### 7.4 Git workflow
- **Branches:**
  - `main` — production (protected)
  - `develop` — integration
  - `feature/<name>` — features
  - `fix/<name>` — bug fixes
- **Commit format (Conventional Commits):**
  ```
  feat(web): add hero section parallax
  fix(api): handle null user case in booking
  docs: update PROJECT_BRIEF
  refactor(mobile): extract DigitalKey hook
  ```

### 7.5 ESLint + Prettier
- Cài shared config trong `packages/config`
- Pre-commit hook với `lint-staged`

---

## 8. 🛠️ Hướng dẫn Setup ban đầu

```bash
# 1. Tạo project
mkdir tram-huong-resort && cd tram-huong-resort

# 2. Init monorepo
pnpm init
pnpm add -D turbo typescript

# 3. Tạo workspace
echo 'packages:
  - "apps/*"
  - "packages/*"
  - "api"' > pnpm-workspace.yaml

# 4. Setup từng app (làm theo Phase 1 của lệnh Claude Code)

# 5. Database local
docker run -d --name tram-huong-db \
  -e POSTGRES_PASSWORD=dev \
  -e POSTGRES_DB=tram_huong \
  -p 5432:5432 \
  postgres:16

# 6. Environment variables
cp .env.example .env.local
# Điền: DATABASE_URL, AUTH_SECRET, VNPAY_*, MOMO_*, ZALOPAY_*, CLOUDINARY_*, etc.
```

---

## 9. 🌐 Deploy & DevOps

### 9.1 Hosting
- **Web (Next.js)** → Vercel (free tier)
- **Admin (Vite)** → Vercel hoặc Cloudflare Pages
- **API (Hono)** → Railway ($5/tháng)
- **Database** → Railway PostgreSQL ($5/tháng) hoặc Supabase free
- **Mobile** → Expo EAS Build → App Store / Play Store

### 9.2 Domain
- Đăng ký: `tramhuong-resort.vn` (Mắt Bão / PA Việt Nam)
- DNS: Cloudflare (free)
- Subdomains:
  - `www.tramhuong-resort.vn` → web
  - `admin.tramhuong-resort.vn` → admin
  - `api.tramhuong-resort.vn` → api

### 9.3 Environment
- **Development:** local + branch previews trên Vercel
- **Staging:** `develop` branch → preview URLs
- **Production:** `main` branch → custom domain

### 9.4 Monitoring
- **Uptime:** UptimeRobot (free)
- **Errors:** Sentry (free 5k events/tháng)
- **Analytics:** Vercel Analytics + Umami self-hosted

---

## 10. 💰 Chi phí dự tính

| Mục | Free tier ban đầu | Khi scale |
|---|---|---|
| Vercel | $0 | $20/tháng |
| Railway | $5/tháng | $20+/tháng |
| Domain .vn | ~750k/năm | — |
| Cloudinary | Free 25 GB | $99/tháng |
| Mapbox | Free 50k loads | Pay per use |
| Sentry | Free | $26/tháng |
| Resend | Free 3k email/tháng | $20/tháng |
| Pusher | Free 200k msg/ngày | $49/tháng |
| **Tổng tháng đầu** | **~$5 + domain** | **~$200/tháng** |

---

## 11. ⚠️ Rủi ro & Mitigation

| Rủi ro | Mức độ | Mitigation |
|---|---|---|
| Burnout do solo dev quá lâu | 🔴 Cao | Làm theo phase, ship MVP trước, nghỉ định kỳ |
| Tech debt khi vội | 🟡 Trung | Code review tự, test các flow quan trọng |
| Payment integration phức tạp | 🟡 Trung | Bắt đầu với VNPay (đơn giản nhất), thêm MoMo/ZaloPay sau |

| Mobile app store rejection | 🟡 Trung | Đọc kỹ guidelines, test internal trước |
| Database hỏng | 🔴 Cao | Backup daily, test restore |
| Bug production ảnh hưởng booking | 🔴 Cao | Staging env, gradual rollout, fallback to manual booking |

---

## 12. 📚 Tài liệu tham khảo

### 12.1 Công nghệ
- [Next.js Docs](https://nextjs.org/docs)
- [Hono Docs](https://hono.dev)
- [Prisma Docs](https://www.prisma.io/docs)
- [Expo Docs](https://docs.expo.dev)
- [Tailwind v4](https://tailwindcss.com)

### 12.2 Payment Vietnam
- [VNPay Documentation](https://sandbox.vnpayment.vn/apis/)
- [MoMo Developer](https://developers.momo.vn)
- [ZaloPay Docs](https://docs.zalopay.vn)

### 12.3 Inspiration thiết kế
- Reverie (smooth scroll animations)
- Stripe.com (premium feel, micro-interactions)
- Awwwards.com — Resort category
- Apple.com (parallax storytelling)

---

## 13. 🎯 Lệnh khởi động Claude Code (Phase 1)

Mở **Claude Code trong VS Code**, paste lệnh sau:

```
Tôi đang xây dự án "Trầm Hương Eco-Resort" — hệ thống quản lý resort sinh thái 
ở Bình Định. Đọc file PROJECT_BRIEF.md trong thư mục gốc để hiểu toàn bộ context.

Bắt đầu PHASE 1 (Nền móng) như sau, làm TỪNG BƯỚC một, mỗi bước giải thích 
trước khi thực hiện và đợi tôi xác nhận:

1. Init Turborepo + pnpm workspace
2. Setup apps/web (Next.js 15 + App Router + Tailwind v4 + TypeScript strict)
3. Setup apps/admin (Vite + React 19 + Tailwind v4 + TypeScript strict)
4. Setup api/ (Hono + Node.js 22 + TypeScript strict)
5. Setup packages/database (Prisma + PostgreSQL với schema Phase 1: User, Room, RoomType, Booking)
6. Setup packages/shared (types, utils, constants chung)
7. Setup packages/ui (shadcn/ui base components)
8. Setup packages/config (ESLint, Prettier, TS configs chung)
9. Tạo .env.example, .gitignore, README.md
10. Test: pnpm dev chạy được cả 3 apps cùng lúc

Quy ước:
- Code TypeScript strict
- Naming theo PROJECT_BRIEF.md section 7
- Commit theo Conventional Commits
- Không cài lib thừa, chỉ cài khi thực sự cần

Sau khi xong Phase 1, KHÔNG tự động sang Phase 2 — chờ tôi review.
```

---

## 14. 📝 Changelog

| Version | Date | Changes |
|---|---|---|
| 1.0 | 31/05/2026 | Tài liệu khởi tạo, định nghĩa toàn bộ scope |

---

## 15. 📞 Liên hệ & Kế thừa

Nếu bạn cần bàn giao dự án cho người khác, đảm bảo:
- [ ] Đọc file này từ đầu tới cuối
- [ ] Có quyền truy cập GitHub repo
- [ ] Có quyền truy cập Vercel + Railway
- [ ] Có file `.env.production` (lưu safely)
- [ ] Đọc thêm `docs/ARCHITECTURE.md` và `docs/API.md`

---

> 🌿 **Một lời nhắn cuối**: Dự án này là cuộc marathon, không phải sprint. Mỗi tuần 10h, nhất quán hơn quan trọng hơn nhanh. Khi nào kiệt sức, nghỉ. Khi nào nản, đọc lại section 1.2 — mục tiêu vẫn còn đó. Chúc bạn build vui và ra sản phẩm! 

**— End of PROJECT_BRIEF.md —**
