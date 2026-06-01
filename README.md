# Trầm Hương Eco-Resort — Monorepo

Hệ thống quản lý resort sinh thái tại Bình Định.

## Cấu trúc

```
apps/web      → Website khách hàng  (Next.js 15, port 3000)
apps/admin    → Dashboard admin     (Vite + React 19, port 3001)
api/          → Backend API         (Hono, port 4000)
packages/
  shared      → Types, utils, constants chung
  database    → Prisma schema + client
  config      → ESLint, Prettier, TypeScript configs
```

## Chạy local

```bash
# Cài dependencies
pnpm install

# Chạy tất cả apps cùng lúc
pnpm dev

# Hoặc từng app riêng
pnpm --filter @tram-huong/web dev
pnpm --filter @tram-huong/admin dev
pnpm --filter @tram-huong/api dev
```

## Database (PostgreSQL local)

```bash
# Chạy PostgreSQL bằng Docker
docker run -d --name tram-huong-db \
  -e POSTGRES_PASSWORD=dev \
  -e POSTGRES_DB=tram_huong \
  -p 5432:5432 \
  postgres:16

# Copy env
cp .env.example api/.env

# Tạo tables
pnpm --filter @tram-huong/database db:push

# Seed dữ liệu mẫu
pnpm --filter @tram-huong/database db:seed
```

## Ports

| Service | Port |
|---------|------|
| Web (Next.js) | 3000 |
| Admin (Vite) | 3001 |
| API (Hono) | 4000 |
| DB (PostgreSQL) | 5432 |
