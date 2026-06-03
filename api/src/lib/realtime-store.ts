import { prisma } from '@tram-huong/database'

export type CrowdLevel = 'LOW' | 'MEDIUM' | 'HIGH'

type RealtimeSettings = {
  crowdLevel: CrowdLevel
  notice: string
  updatedAt: string
  updatedBy: string
}

// In-memory cache để tránh query DB mỗi request
let cache: RealtimeSettings | null = null

const DEFAULTS: RealtimeSettings = {
  crowdLevel: 'LOW',
  notice: '',
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
}

export async function getRealtimeSettings(): Promise<RealtimeSettings> {
  if (cache) return cache

  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: ['crowdLevel', 'notice', 'realtimeUpdatedAt', 'realtimeUpdatedBy'] } },
    })
    const map = Object.fromEntries(rows.map(r => [r.key, r.value]))

    cache = {
      crowdLevel: (map['crowdLevel'] as CrowdLevel) ?? DEFAULTS.crowdLevel,
      notice: map['notice'] ?? DEFAULTS.notice,
      updatedAt: map['realtimeUpdatedAt'] ?? DEFAULTS.updatedAt,
      updatedBy: map['realtimeUpdatedBy'] ?? DEFAULTS.updatedBy,
    }
    return cache
  } catch {
    // DB chưa sẵn sàng (local dev) — fallback về in-memory
    return cache ?? DEFAULTS
  }
}

export async function updateRealtimeSettings(
  patch: Partial<Omit<RealtimeSettings, 'updatedAt'>>,
  updatedBy: string
): Promise<RealtimeSettings> {
  const current = await getRealtimeSettings()
  const next: RealtimeSettings = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
    updatedBy,
  }

  // Persist to DB (upsert từng key)
  try {
    await prisma.$transaction([
      prisma.setting.upsert({ where: { key: 'crowdLevel' },       update: { value: next.crowdLevel, updatedBy }, create: { key: 'crowdLevel',       value: next.crowdLevel, updatedBy } }),
      prisma.setting.upsert({ where: { key: 'notice' },            update: { value: next.notice, updatedBy },    create: { key: 'notice',            value: next.notice,    updatedBy } }),
      prisma.setting.upsert({ where: { key: 'realtimeUpdatedAt' }, update: { value: next.updatedAt, updatedBy }, create: { key: 'realtimeUpdatedAt', value: next.updatedAt, updatedBy } }),
      prisma.setting.upsert({ where: { key: 'realtimeUpdatedBy' }, update: { value: updatedBy, updatedBy },      create: { key: 'realtimeUpdatedBy', value: updatedBy,      updatedBy } }),
    ])
  } catch {
    // Nếu DB lỗi vẫn cập nhật cache
  }

  cache = next
  return next
}
