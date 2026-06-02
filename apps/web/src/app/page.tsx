import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { HeroSection } from "@/components/hero-section";
import { BookingBar } from "@/components/booking-bar";
import { RealtimeBar } from "@/components/realtime-bar";
import { AboutSection } from "@/components/about-section";
import { ExperienceSection } from "@/components/experience-section";
import { RoomTypesSection } from "@/components/room-types-section";
import { ActivitiesSection } from "@/components/activities-section";
import { ReviewsSection } from "@/components/reviews-section";
import { ZaloButton } from "@/components/zalo-button";
import { SiteFooter } from "@/components/site-footer";
import { JsonLd } from "@/components/json-ld";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://tramhuong-resort.vn";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const RESORT_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "LodgingBusiness",
  name: "Trầm Hương Eco-Resort",
  description:
    "Khu nghỉ dưỡng sinh thái cao cấp tại Bình Định, Việt Nam",
  url: BASE_URL,
  telephone: "+84-256-XXX-XXXX",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Bình Định",
    addressCountry: "VN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 13.9,
    longitude: 108.9,
  },
  starRating: { "@type": "Rating", ratingValue: "4" },
  priceRange: "₫₫₫",
  amenityFeature: [
    { "@type": "LocationFeatureSpecification", name: "Swimming Pool", value: true },
    { "@type": "LocationFeatureSpecification", name: "Spa", value: true },
    { "@type": "LocationFeatureSpecification", name: "Restaurant", value: true },
    { "@type": "LocationFeatureSpecification", name: "Free WiFi", value: true },
  ],
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={RESORT_SCHEMA} />
      <SiteNav />
      <main>
        <HeroSection />
        <BookingBar />
        <RealtimeBar />
        <AboutSection />
        <ExperienceSection />
        <RoomTypesSection />
        <ActivitiesSection />
        <ReviewsSection />
      </main>
      <ZaloButton />
      <SiteFooter />
    </>
  );
}
