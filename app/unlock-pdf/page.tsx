import PdfUnlock from "@/components/page/PdfUnlock";
import Hero from "@/components/layout/Hero";
import JsonLd from "@/components/JsonLd";
import ToolContent from "@/components/page/ToolContent";

import { toolJsonLd, toolMetadata } from "@/lib/seo";

export const metadata = toolMetadata("unlock-pdf");

export default function UnlockPage() {
  const heroData = {
    title: "Unlock PDF",
    desc: "Remove a password or restrictions from a PDF you have the right to open.",
  };

  return (
    <>
      <JsonLd data={toolJsonLd("unlock-pdf")} />
      <Hero title={heroData.title} desc={heroData.desc} />
      <PdfUnlock />
      <ToolContent slug="unlock-pdf" />
    </>
  );
}
