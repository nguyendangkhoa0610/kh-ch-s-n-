import { NextResponse } from "next/server";
import { ACTIVITIES } from "@/lib/activity-data";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function getCrowdLevel(): Promise<"LOW" | "MEDIUM" | "HIGH"> {
  try {
    const res = await fetch(`${API_BASE}/staff/realtime`, { next: { revalidate: 60 } });
    if (res.ok) {
      const j = await res.json() as { data: { crowdLevel: "LOW" | "MEDIUM" | "HIGH" } };
      return j.data.crowdLevel;
    }
  } catch { /* fallback */ }
  // Fallback theo giờ
  const hour = new Date().getHours();
  if (hour >= 10 && hour <= 14) return "HIGH";
  if (hour >= 7 && hour <= 18) return "MEDIUM";
  return "LOW";
}

// Lấy hoạt động có lịch trong ngày hôm nay
function getTodayEvents() {
  const now = new Date();
  const currentHour = now.getHours() * 60 + now.getMinutes();

  // Map schedule string "HH:MM" → minutes since midnight
  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  };

  // Lấy các buổi chưa qua trong ngày hôm nay (hoặc tất cả nếu giờ khuya)
  const events: { time: string; name: string; slug: string; emoji: string; price: number }[] = [];

  for (const act of ACTIVITIES) {
    for (const time of act.schedules) {
      const mins = toMinutes(time);
      // Chỉ show các buổi trong vòng 12 giờ tới
      const diff = mins - currentHour;
      if (diff > -30 && diff < 720) {
        events.push({
          time,
          name: act.name,
          slug: act.slug,
          emoji: act.emoji,
          price: act.price,
        });
      }
    }
  }

  // Sắp xếp theo giờ, lấy 4 buổi gần nhất
  return events
    .sort((a, b) => toMinutes(a.time) - toMinutes(b.time))
    .slice(0, 4);
}

export async function GET() {
  const crowd = await getCrowdLevel();
  const events = getTodayEvents();

  // Fetch weather từ Open-Meteo (Phù Cát, Bình Định)
  let weather = null;
  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=13.85&longitude=109.13" +
        "&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m" +
        "&timezone=Asia%2FHo_Chi_Minh&forecast_days=1",
      { next: { revalidate: 600 } } // cache 10 phút
    );
    if (res.ok) {
      const data = await res.json() as {
        current: {
          temperature_2m: number;
          weather_code: number;
          wind_speed_10m: number;
          relative_humidity_2m: number;
        };
      };
      weather = {
        temp: Math.round(data.current.temperature_2m),
        code: data.current.weather_code,
        wind: Math.round(data.current.wind_speed_10m),
        humidity: data.current.relative_humidity_2m,
      };
    }
  } catch {
    // Weather không bắt buộc — fail silently
  }

  // Lấy thông báo khẩn từ admin settings
  let notice = ''
  try {
    const sr = await fetch(`${API_BASE}/staff/realtime`, { next: { revalidate: 60 } })
    if (sr.ok) {
      const sd = await sr.json() as { data: { notice: string } }
      notice = sd.data.notice ?? ''
    }
  } catch { /* ignore */ }

  return NextResponse.json({
    weather,
    crowd,
    notice,
    events,
    updatedAt: new Date().toISOString(),
  });
}
