const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

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
