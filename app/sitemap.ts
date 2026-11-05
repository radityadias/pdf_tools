import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { TOOLS } from "@/lib/tools";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  
  return [
    { url: SITE.url, lastModified: now, changeFrequency: "monthly", priority: 1 },
    ...TOOLS.map((t) => ({
      url: `${SITE.url}/${t.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}