import type { MetadataRoute } from "next";
import { absoluteUrl, SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/browse",
          "/beta",
          "/listing/",
          "/seller/",
          "/how-it-works",
          "/terms",
          "/privacy",
          "/refund",
        ],
        disallow: [
          "/admin",
          "/dashboard",
          "/connects",
          "/create",
          "/beta/create",
          "/settings",
          "/sign-in",
          "/sign-up",
          "/listing/*/edit",
          "/listing/*/verify",
          "/api/",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: new URL(SITE_URL).host,
  };
}
