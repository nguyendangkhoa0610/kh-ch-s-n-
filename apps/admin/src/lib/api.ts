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

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  const json = await res.json() as { data: T }
  return json.data
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
  user: { name: string; email: string; phone: string }
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

export const api = {
  getRooms: () => get<Room[]>('/rooms'),
  getRoomTypes: () => get<unknown[]>('/rooms/types'),
  updateRoomStatus: (id: string, status: string) =>
    patch<Room>(`/rooms/${id}/status`, { status }),

  getBookings: (status?: string) =>
    get<Booking[]>('/bookings' + (status ? `?status=${status}` : '')),
  updateBookingStatus: (id: string, status: string) =>
    patch<Booking>(`/bookings/${id}/status`, { status }),

  getRevenueChart: (days = 7) => get<RevenuePoint[]>(`/reports/revenue?days=${days}`),
  getSummary: () => get<Summary>('/reports/summary'),

  // Activities
  getActivities: () => get<{ id: string; slug: string; name: string; price: number; duration: number; maxSlots: number; category: string; isActive: boolean }[]>('/activities'),
  toggleActivity: (id: string, isActive: boolean) => patch<unknown>(`/activities/${id}`, { isActive }),
}
