import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = env.APP_URL.replace(/\/$/, "");
  const now = new Date();

  const routes = [
    { path: "/", priority: 1 },
    { path: "/pricing", priority: 0.9 },
    { path: "/signup", priority: 0.8 },
    { path: "/login", priority: 0.5 },
    { path: "/disclaimer", priority: 0.4 },
    { path: "/privacy", priority: 0.3 },
    { path: "/terms", priority: 0.3 },
  ];

  return routes.map((r) => ({
    url: `${base}${r.path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: r.priority,
  }));
}
