import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đặt phòng",
  description:
    "Đặt phòng tại Trầm Hương Eco-Resort — Bình Định. Thanh toán VNPay, MoMo, ZaloPay, tiền mặt. Xác nhận ngay qua email.",
  alternates: { canonical: "/dat-phong" },
  openGraph: {
    title: "Đặt phòng | Trầm Hương Eco-Resort",
    description: "Đặt phòng trực tuyến — xác nhận ngay, thanh toán linh hoạt",
  },
};

export default function DatPhongLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
