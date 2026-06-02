const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type DBRoomType = {
  id: string; slug: string; name: string; tagline: string; description: string
  basePrice: number; capacity: number; size: number; bedType: string; view: string
  amenities: string; images: string; badge: string | null
}

// Fetch tất cả room type data từ DB — cache 5 phút, fallback về [] nếu lỗi
export async function fetchDBRoomTypes(): Promise<DBRoomType[]> {
  try {
    const res = await fetch(`${API_BASE}/rooms/types`, {
      next: { revalidate: 300 }, // cache 5 phút
    });
    if (!res.ok) return [];
    const json = await res.json() as { data: DBRoomType[] };
    return json.data ?? [];
  } catch {
    return []; // fallback về static data nếu DB không kết nối được
  }
}

// Merge DB data lên static data (DB ưu tiên)
export async function fetchRoomTypeImages(): Promise<Record<string, string[]>> {
  const types = await fetchDBRoomTypes();
  const map: Record<string, string[]> = {};
  for (const rt of types) {
    try {
      const imgs = JSON.parse(rt.images ?? '[]') as string[];
      if (imgs.length > 0) map[rt.slug] = imgs;
    } catch { /* skip */ }
  }
  return map;
}

export type GuestBookingPayload = {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomSlug: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  paymentMethod: string;
  notes?: string;
  userId?: string; // truyền khi user đã đăng nhập để link booking với account
};

export type BookingResult = {
  id: string;
  code: string;
  totalAmount: number;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: string;
  room: {
    number: string;
    roomType: { name: string; slug: string };
  } | null;
  user: { name: string; email: string; phone: string };
};

export async function createGuestBooking(
  payload: GuestBookingPayload
): Promise<BookingResult> {
  const res = await fetch(`${API_BASE}/bookings/guest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Đặt phòng thất bại");
  }

  const json = await res.json() as { data: BookingResult };
  return json.data;
}
