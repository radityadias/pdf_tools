import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { TOOLS } from "@/lib/tools";

export const dynamic = "force-static";

const INFO_PAGES = ["about", "contact", "privacy-policy", "terms-and-conditions"];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE.url, changeFrequency: "monthly", priority: 1 },
    ...TOOLS.map((t) => ({
      url: `${SITE.url}/${t.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...INFO_PAGES.map((p) => ({
      url: `${SITE.url}/${p}`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}