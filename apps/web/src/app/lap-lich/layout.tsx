import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lập lịch trình AI — Trầm Hương Eco-Resort",
  description:
    "Để AI Concierge lên kế hoạch nghỉ dưỡng cá nhân hóa cho bạn — từ phòng phù hợp đến từng hoạt động theo ngày.",
};

export default function LapLichLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
