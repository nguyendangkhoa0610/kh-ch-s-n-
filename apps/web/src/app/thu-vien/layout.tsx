import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thư viện ảnh — Trầm Hương Eco-Resort",
  description:
    "Khám phá vẻ đẹp của Trầm Hương Eco-Resort qua từng khung hình — phòng nghỉ, hoạt động ngoài trời, ẩm thực địa phương và thiên nhiên Bình Định.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
