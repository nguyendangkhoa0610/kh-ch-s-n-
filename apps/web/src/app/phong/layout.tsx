import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Phòng & Chỗ nghỉ",
  description:
    "6 loại phòng đặc biệt tại Trầm Hương Eco-Resort: Bungalow View Biển, Nhà Sàn Rừng, Villa Gia Đình, Eco Pod, Lều Đồng Cỏ, Suite Trầm Hương. Từ 1.6 triệu / đêm.",
  alternates: { canonical: "/phong" },
  openGraph: {
    title: "Phòng & Chỗ nghỉ | Trầm Hương Eco-Resort",
    description: "6 loại phòng đặc biệt — từ bungalow ven biển đến eco pod nhìn sao đêm",
  },
};

export default function PhongLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
