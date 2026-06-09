import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep private app, admin, and API surfaces out of the index.
      disallow: [
        "/admin",
        "/api",
        "/dashboard",
        "/claims",
        "/packet",
        "/library",
        "/onboarding",
        "/settings",
        "/billing",
        "/support",
      ],
    },
    sitemap: `${env.APP_URL}/sitemap.xml`,
  };
}
