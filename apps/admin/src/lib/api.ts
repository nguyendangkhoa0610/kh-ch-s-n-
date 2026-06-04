import { useAuth } from './auth'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

function headers() {
  return useAuth.getState().getHeaders()
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: headers() })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  const json = await res.json() as { data: T }
  return json.data
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const json = await res.json() as { error?: string }
    throw new Error(json.error ?? `API error ${res.status}`)
  }
  const json = await res.json() as { data: T }
  return json.data
}

async function del(path: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE', headers: headers() })
  if (!res.ok) {
    const json = await res.json() as { error?: string }
    throw new Error(json.error ?? `API error ${res.status}`)
  }
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  const json = await res.json() as { data: T }
  return json.data
}


export type RoomType = {
  id: string
  name: string
  slug: string
  tagline: string
  description: string
  basePrice: number
  capacity: number
  size: number
  bedType: string
  view: string
  amenities: string // JSON string
  images: string   // JSON string
  badge: string | null
}

export type Room = {
  id: string
  number: string
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE'
  floor: number
  roomType: { name: string; slug: string; basePrice: number; capacity: number }
}

export type Booking = {
  id: string
  code: string
  checkIn: string
  checkOut: string
  guests: number
  totalAmount: number
  status: string
  notes: string | null
  createdAt: string
  user: { id: string; name: string; email: string; phone: string }
  room: { number: string; roomType: { name: string } } | null
}

export type RevenuePoint = { date: string; label: string; revenue: number; bookings: number }
export type Summary = {
  totalBookings: number
  totalRevenue: number
  roomsAvailable: number
  roomsOccupied: number
  roomsTotal: number
  recentBookings: Booking[]
}

export type HousekeepingTask = {
  id: string
  type: 'CHECKOUT' | 'STAYOVER' | 'INSPECTION' | 'DEEP_CLEAN'
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  notes: string | null
  scheduledFor: string
  startedAt: string | null
  completedAt: string | null
  room: { id: string; number: string; floor: number; roomType: { name: string } }
  assignedTo: { id: string; name: string } | null
}

export type Staff = { id: string; name: string; role: string }

export type MenuItem = {
  id: string; name: string; nameEn: string | null; description: string | null
  category: string; price: number; image: string | null
  isActive: boolean; isVeg: boolean; sortOrder: number
}

export type FoodOrder = {
  id: string; status: string; totalAmount: number; notes: string | null; createdAt: string
  booking: { code: string; room: { number: string } | null }
  user: { name: string; phone: string | null }
  items: { id: string; quantity: number; unitPrice: number; menuItem: { name: string } }[]
}

export type GiftVoucher = {
  id: string; code: string; value: number; status: string
  fromName: string; fromEmail: string; toName: string; toEmail: string
  message: string | null; expiresAt: string; usedAt: string | null; createdAt: string
}

export type SeasonalPrice = {
  id: string; name: string; startDate: string; endDate: string
  priceMultiplier: number; fixedPrice: number | null; isActive: boolean
  roomType: { name: string; slug: string; basePrice: number }
}

export type MaintenanceRequest = {
  id: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  photoUrl: string | null
  resolvedAt: string | null
  createdAt: string
  room: { number: string; floor: number; roomType: { name: string } }
  reporter: { name: string; role: string }
}

export type GuestProfile = {
  user: { id: string; name: string; email: string | null; phone: string | null; avatar: string | null; ecoPoints: number; createdAt: string }
  bookings: Booking[]
  stats: { totalBookings: number; completedBookings: number; cancelledBookings: number; totalSpend: number }
}

export const api = {
  getRooms: () => get<Room[]>('/rooms'),
  getRoomTypes: () => get<RoomType[]>('/rooms/types'),
  updateRoomStatus: (id: string, status: string) =>
    patch<Room>(`/rooms/${id}/status`, { status }),
  updateRoomType: (id: string, data: Partial<Omit<RoomType, 'id' | 'slug'> & { amenities: string[]; images: string[] }>) =>
    patch<RoomType>(`/rooms/types/${id}`, data),
  createRoom: (data: { number: string; floor: number; roomTypeId: string }) =>
    post<Room>('/rooms', data),
  deleteRoom: (id: string) => del(`/rooms/${id}`),

  getBookings: (status?: string) =>
    get<Booking[]>('/bookings' + (status ? `?status=${status}` : '')),
  updateBookingStatus: (id: string, status: string) =>
    patch<Booking>(`/bookings/${id}/status`, { status }),

  getRevenueChart: (days = 7) => get<RevenuePoint[]>(`/reports/revenue?days=${days}`),
  getSummary: () => get<Summary>('/reports/summary'),

  // Activities
  getActivities: () => get<{ id: string; slug: string; name: string; price: number; duration: number; maxSlots: number; category: string; isActive: boolean }[]>('/activities'),
  toggleActivity: (id: string, isActive: boolean) => patch<unknown>(`/activities/${id}`, { isActive }),

  // Housekeeping
  getHousekeepingTasks: (date?: string, status?: string) =>
    get<HousekeepingTask[]>(`/housekeeping?${date ? `date=${date}` : ''}${status ? `&status=${status}` : ''}`),
  getRoomsStatus: () => get<(Room & { tasks: HousekeepingTask[] })[]>('/housekeeping/rooms-status'),
  createHousekeepingTask: (data: { roomId: string; type?: string; priority?: string; assignedToId?: string; notes?: string; scheduledFor?: string }) =>
    post<HousekeepingTask>('/housekeeping', data),
  updateHousekeepingTask: (id: string, data: { status?: string; assignedToId?: string; notes?: string; priority?: string }) =>
    patch<HousekeepingTask>(`/housekeeping/${id}`, data),
  deleteHousekeepingTask: (id: string) => del(`/housekeeping/${id}`),
  autoGenerateHousekeeping: () => post<{ count: number }>('/housekeeping/auto-generate', {}),

  // Settings
  getSettings: () => get<Record<string, string>>('/settings'),
  updateSettings: (data: Record<string, string>) => {
    const h = headers()
    return fetch(`${BASE}/settings`, {
      method: 'PUT', headers: h, body: JSON.stringify(data),
    }).then(r => r.json() as Promise<{ ok: boolean }>)
  },

  // Staff list (for housekeeping assignment)
  getStaffList: () => get<Staff[]>('/staff'),

  // Guest profile
  getGuestProfile: (userId: string) => get<GuestProfile>(`/bookings/guest-profile/${userId}`),

  // Menu
  getAllMenuItems: () => get<MenuItem[]>('/menu/all'),
  createMenuItem: (data: Partial<MenuItem>) => post<MenuItem>('/menu', data),
  updateMenuItem: (id: string, data: Partial<MenuItem>) => patch<MenuItem>(`/menu/${id}`, data),
  deleteMenuItem: (id: string) => del(`/menu/${id}`),
  getFoodOrders: (status?: string) =>
    get<FoodOrder[]>('/menu/orders' + (status ? `?status=${status}` : '')),
  updateFoodOrderStatus: (id: string, status: string) =>
    patch<FoodOrder>(`/menu/orders/${id}`, { status }),

  // Vouchers
  getVouchers: () => get<GiftVoucher[]>('/vouchers'),
  createVoucher: (data: { value: number; fromName: string; fromEmail: string; toName: string; toEmail: string; message?: string }) =>
    post<GiftVoucher>('/vouchers', data),
  deleteVoucher: (id: string) => del(`/vouchers/${id}`),

  // Dynamic pricing
  getPricing: () => get<SeasonalPrice[]>('/pricing'),
  createPricing: (data: { roomTypeId: string; name: string; startDate: string; endDate: string; priceMultiplier?: number; fixedPrice?: number }) =>
    post<SeasonalPrice>('/pricing', data),
  updatePricing: (id: string, data: Partial<SeasonalPrice>) => patch<SeasonalPrice>(`/pricing/${id}`, data),
  deletePricing: (id: string) => del(`/pricing/${id}`),

  // Maintenance
  getMaintenanceRequests: (status?: string) =>
    get<MaintenanceRequest[]>('/maintenance' + (status ? `?status=${status}` : '')),
  updateMaintenanceRequest: (id: string, data: { status?: string; priority?: string }) =>
    patch<MaintenanceRequest>(`/maintenance/${id}`, data),
  deleteMaintenanceRequest: (id: string) => del(`/maintenance/${id}`),

  // Push notifications
  sendNotification: (data: { roles?: string[]; userIds?: string[]; title: string; message: string }) =>
    post<{ sent: number }>('/notifications/send', data),
}
