export const RESORT_NAME = 'Trầm Hương Eco-Resort'
export const RESORT_LOCATION = 'Bình Định, Việt Nam'

export const BOOKING_DEPOSIT_PERCENT = 30

export const ROOM_STATUS_LABEL: Record<string, string> = {
  AVAILABLE: 'Còn trống',
  OCCUPIED: 'Đang có khách',
  MAINTENANCE: 'Bảo trì',
}

export const BOOKING_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đã nhận phòng',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
}

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  VNPAY: 'VNPay',
  MOMO: 'MoMo',
  ZALOPAY: 'ZaloPay',
  CASH: 'Tiền mặt',
}

export const ACTIVITY_CATEGORY_LABEL: Record<string, string> = {
  water: 'Dưới nước',
  land: 'Trên bờ',
  wellness: 'Sức khỏe',
  food: 'Ẩm thực',
}

export const ROLE_LABEL: Record<string, string> = {
  GUEST: 'Khách',
  STAFF: 'Nhân viên',
  MANAGER: 'Quản lý',
  ADMIN: 'Admin',
}
