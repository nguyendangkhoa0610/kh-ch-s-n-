import type { MetadataRoute } from "next";
import { ROOM_TYPES } from "@/lib/room-data";
import { ACTIVITIES } from "@/lib/activity-data";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://tramhuong-resort.vn";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL,                              lastModified: new Date(), changeFrequency: "weekly",   priority: 1.0 },
    { url: `${BASE_URL}/phong`,                   lastModified: new Date(), changeFrequency: "weekly",   priority: 0.9 },
    { url: `${BASE_URL}/hoat-dong`,               lastModified: new Date(), changeFrequency: "weekly",   priority: 0.8 },
    { url: `${BASE_URL}/dat-phong`,               lastModified: new Date(), changeFrequency: "monthly",  priority: 0.9 },
    { url: `${BASE_URL}/gioi-thieu`,              lastModified: new Date(), changeFrequency: "monthly",  priority: 0.7 },
    { url: `${BASE_URL}/thu-vien`,                lastModified: new Date(), changeFrequency: "monthly",  priority: 0.7 },
    { url: `${BASE_URL}/lien-he`,                 lastModified: new Date(), changeFrequency: "yearly",   priority: 0.6 },
    { url: `${BASE_URL}/lap-lich`,                lastModified: new Date(), changeFrequency: "monthly",  priority: 0.8 },
    { url: `${BASE_URL}/ban-do`,                  lastModified: new Date(), changeFrequency: "yearly",   priority: 0.6 },
    { url: `${BASE_URL}/dat-phong/tra-cuu`,       lastModified: new Date(), changeFrequency: "yearly",   priority: 0.5 },
    { url: `${BASE_URL}/chinh-sach-bao-mat`,      lastModified: new Date(), changeFrequency: "yearly",   priority: 0.3 },
    { url: `${BASE_URL}/dieu-khoan-dich-vu`,      lastModified: new Date(), changeFrequency: "yearly",   priority: 0.3 },
  ];

  const roomPages: MetadataRoute.Sitemap = ROOM_TYPES.map((r) => ({
    url: `${BASE_URL}/phong/${r.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const activityPages: MetadataRoute.Sitemap = ACTIVITIES.map((a) => ({
    url: `${BASE_URL}/hoat-dong/${a.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...roomPages, ...activityPages];
}
