import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tra cứu đặt phòng — Trầm Hương Eco-Resort",
  description: "Nhập mã đặt phòng để kiểm tra trạng thái, ngày check-in/out và chi tiết booking của bạn.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
