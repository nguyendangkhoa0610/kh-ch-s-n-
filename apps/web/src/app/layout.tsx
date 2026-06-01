import type { Metadata, Viewport } from "next";
import { Lora, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/language-provider";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
});

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://tramhuong-resort.vn";

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Trầm Hương Eco-Resort — Bình Định",
    template: "%s | Trầm Hương Eco-Resort",
  },
  description:
    "Khu nghỉ dưỡng sinh thái cao cấp tại Bình Định, Việt Nam. Trải nghiệm thiên nhiên thuần khiết giữa núi rừng trầm hương — Digital Key, AI Concierge.",
  keywords: [
    "resort Bình Định",
    "eco resort Vietnam",
    "khu nghỉ dưỡng sinh thái",
    "trầm hương",
    "Binh Dinh resort",
    "luxury eco resort",
    "nghỉ dưỡng Bình Định",
  ],
  authors: [{ name: "Trầm Hương Eco-Resort" }],
  creator: "Trầm Hương Eco-Resort",
  openGraph: {
    title: "Trầm Hương Eco-Resort — Bình Định",
    description: "Hương của núi rừng, hồn của Bình Định",
    url: BASE_URL,
    siteName: "Trầm Hương Eco-Resort",
    locale: "vi_VN",
    alternateLocale: "en_US",
    type: "website",
    images: [
      {
        url: `${BASE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Trầm Hương Eco-Resort",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trầm Hương Eco-Resort",
    description: "Khu nghỉ dưỡng sinh thái cao cấp tại Bình Định",
    images: [`${BASE_URL}/og-image.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${lora.variable} ${beVietnamPro.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
