import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ROOM_TYPES } from "@/lib/room-data";
import { ACTIVITIES } from "@/lib/activity-data";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type ItineraryRequest = {
  nights: number;
  groupType: string;
  interests: string[];
  budget: string;
  notes?: string;
};

export type ItinerarySlot = {
  time: string;
  title: string;
  desc: string;
  activitySlug?: string;
  type: "activity" | "meal" | "rest" | "travel";
};

export type ItineraryDay = {
  day: number;
  title: string;
  slots: ItinerarySlot[];
};

export type ItineraryResult = {
  headline: string;
  summary: string;
  roomSlug: string;
  roomReason: string;
  days: ItineraryDay[];
  tips: string[];
  estimateRoom: number;
  estimateActivities: number;
  estimateFood: number;
};

// Build prompt from resort data
function buildPrompt(req: ItineraryRequest): string {
  const rooms = ROOM_TYPES.map(
    (r) => `- ${r.slug}: "${r.name}" — ${r.price.toLocaleString("vi-VN")}đ/đêm, ${r.capacity} khách, ${r.tagline}`
  ).join("\n");

  const activities = ACTIVITIES.map(
    (a) =>
      `- ${a.slug}: "${a.name}" [${a.category}] — ${a.price === 0 ? "Miễn phí" : a.price.toLocaleString("vi-VN") + "đ"}, ${a.duration}ph`
  ).join("\n");

  return `Bạn là AI concierge của Trầm Hương Eco-Resort — khu nghỉ dưỡng sinh thái cao cấp tại Bình Định, Việt Nam (rừng trầm hương, biển riêng, 12 hecta).

THÔNG TIN KHÁCH:
- Số đêm: ${req.nights}
- Loại khách: ${req.groupType}
- Sở thích: ${req.interests.join(", ")}
- Ngân sách: ${req.budget}
- Ghi chú thêm: ${req.notes || "Không có"}

CÁC LOẠI PHÒNG CÓ SẴN:
${rooms}

CÁC HOẠT ĐỘNG CÓ SẴN:
${activities}

Hãy tạo một lịch trình nghỉ dưỡng CHI TIẾT, PHÙ HỢP VÀ THỰC TẾ.
Trả về JSON hợp lệ (không có markdown, không có backtick) theo cấu trúc này:

{
  "headline": "Tiêu đề ngắn gọn cho kế hoạch (ví dụ: '3 đêm thư giãn cho cặp đôi')",
  "summary": "Tóm tắt 2-3 câu về kế hoạch, tone ấm áp và hào hứng",
  "roomSlug": "slug phòng phù hợp nhất",
  "roomReason": "Lý do chọn phòng này (1 câu)",
  "days": [
    {
      "day": 1,
      "title": "Tên ngày (ví dụ: Ngày đầu tiên — Đến & cảm nhận)",
      "slots": [
        {
          "time": "HH:MM",
          "title": "Tên hoạt động ngắn",
          "desc": "Mô tả 1-2 câu sinh động",
          "activitySlug": "slug hoạt động nếu có, null nếu không",
          "type": "activity|meal|rest|travel"
        }
      ]
    }
  ],
  "tips": ["Mẹo 1", "Mẹo 2", "Mẹo 3"],
  "estimateRoom": số tiền phòng (số nguyên VND),
  "estimateActivities": ước tính chi phí hoạt động (số nguyên VND),
  "estimateFood": ước tính ăn uống (số nguyên VND)
}

Quy tắc:
- Mỗi ngày có 4-6 slots, bắt đầu từ khoảng 7:00, kết thúc khoảng 21:00
- Ngày đầu bắt đầu lúc check-in (14:00), ngày cuối kết thúc lúc check-out (12:00)
- Ưu tiên các hoạt động từ danh sách có sẵn, dùng đúng slug
- Xen kẽ nghỉ ngơi và hoạt động, không nhồi nhét
- Phù hợp với sở thích và ngân sách đã chọn
- Giọng văn tiếng Việt tự nhiên, thân thiện`;
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "your-key-here") {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY chưa được cấu hình trong .env.local" },
      { status: 503 }
    );
  }

  const body = (await req.json()) as ItineraryRequest;

  if (!body.nights || !body.groupType || !body.interests?.length || !body.budget) {
    return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
  }

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: buildPrompt(body) }],
    });

    const text = message.content
      .filter((c) => c.type === "text")
      .map((c) => (c as { type: "text"; text: string }).text)
      .join("");

    const result = JSON.parse(text) as ItineraryResult;
    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("Claude API error:", err);
    return NextResponse.json(
      { error: "Tạo lịch trình thất bại. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
