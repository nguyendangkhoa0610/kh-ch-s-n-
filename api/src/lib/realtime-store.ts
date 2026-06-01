// In-memory store cho real-time settings
// Resets on server restart — đủ dùng cho local dev, thêm DB persistence khi cần

export type CrowdLevel = 'LOW' | 'MEDIUM' | 'HIGH'

type RealtimeSettings = {
  crowdLevel: CrowdLevel
  notice: string        // Thông báo khẩn từ admin (hiện trên thanh real-time)
  updatedAt: string
  updatedBy: string
}

let settings: RealtimeSettings = {
  crowdLevel: 'LOW',
  notice: '',
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
}

export function getRealtimeSettings(): RealtimeSettings {
  return settings
}

export function updateRealtimeSettings(
  patch: Partial<Omit<RealtimeSettings, 'updatedAt'>>,
  updatedBy: string
) {
  settings = { ...settings, ...patch, updatedAt: new Date().toISOString(), updatedBy }
  return settings
}
