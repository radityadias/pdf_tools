import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { TOOLS } from "@/lib/tools";

function findTool(slug: string) {
  const tool = TOOLS.find((t) => t.slug === slug);
  if (!tool) throw new Error(`Unknown tool: ${slug}`);
  return tool;
}

export function toolMetadata(slug: string): Metadata {
  const tool = findTool(slug);
  const path = `/${tool.slug}`;

  return {
    title: tool.metaTitle, // the layout's template appends "| YourBrand"
    description: tool.metaDescription,
    alternates: { canonical: path },
    openGraph: {
      title: `${tool.metaTitle} | ${SITE.name}`,
      description: tool.metaDescription,
      url: path,
      siteName: SITE.name,
      type: "website",
    },
  };
}

export function toolJsonLd(slug: string) {
  const tool = findTool(slug);
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.title,
    description: tool.metaDescription,
    url: `${SITE.url}/${tool.slug}`,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires a modern web browser",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
  };
}