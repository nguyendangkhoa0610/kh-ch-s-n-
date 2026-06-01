// === Enums ===
export type Role = 'GUEST' | 'STAFF' | 'MANAGER' | 'ADMIN'
export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE'
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED'
export type PaymentMethod = 'VNPAY' | 'MOMO' | 'ZALOPAY' | 'CASH'
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
export type AlertType = 'SOS' | 'INCIDENT' | 'REQUEST'
export type AlertStatus = 'NEW' | 'RESPONDING' | 'RESOLVED'

// === Domain Types ===
export type User = {
  id: string
  email: string | null
  phone: string | null
  name: string
  avatar: string | null
  role: Role
  createdAt: string
  updatedAt: string
}

export type RoomType = {
  id: string
  name: string
  slug: string
  description: string
  basePrice: number
  capacity: number
  size: number
  amenities: string[]
  images: string[]
}

export type Room = {
  id: string
  number: string
  roomTypeId: string
  roomType: RoomType
  status: RoomStatus
}

export type Booking = {
  id: string
  code: string
  userId: string
  user: User
  roomId: string | null
  room: Room | null
  checkIn: string
  checkOut: string
  guests: number
  totalAmount: number
  status: BookingStatus
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type Activity = {
  id: string
  name: string
  slug: string
  description: string
  price: number
  duration: number
  maxSlots: number
  category: 'water' | 'land' | 'wellness' | 'food'
  images: string[]
}

export type SOSAlert = {
  id: string
  userId: string
  type: AlertType
  location: { lat: number; lng: number; area: string }
  message: string | null
  status: AlertStatus
  respondedBy: string | null
  respondedAt: string | null
  createdAt: string
}

// === API Response Types ===
export type ApiResponse<T> = {
  data: T
  message?: string
}

export type ApiError = {
  error: string
  details?: unknown
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
