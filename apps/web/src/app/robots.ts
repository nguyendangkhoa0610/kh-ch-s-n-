import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://tramhuong-resort.vn";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/tai-khoan/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
