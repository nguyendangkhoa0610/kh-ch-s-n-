import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hoạt động & Trải nghiệm",
  description:
    "12 hoạt động độc đáo: chèo SUP, lặn snorkeling, trekking rừng trầm, yoga, spa, đốt lửa trại, học làm bánh xèo. Thiên nhiên là sân chơi.",
  alternates: { canonical: "/hoat-dong" },
  openGraph: {
    title: "Hoạt động | Trầm Hương Eco-Resort",
    description: "12 trải nghiệm từ biển đến rừng — thiên nhiên là sân chơi",
  },
};

export default function HoatDongLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
