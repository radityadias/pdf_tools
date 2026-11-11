import Hero from "@/components/layout/Hero";
import PdfCompressor from "@/components/page/PdfCompressor";
import JsonLd from "@/components/JsonLd";
import ToolContent from "@/components/page/ToolContent";

import { toolJsonLd, toolMetadata } from "@/lib/seo";

export const metadata = toolMetadata("compress-pdf");

export default function CompressPage() {
  const heroData = {
    title: "Compress PDF",
    desc: "Reduce your PDF File to smaller size",
  };

  return (
    <>
      <JsonLd data={toolJsonLd("compress-pdf")} />
      <Hero title={heroData.title} desc={heroData.desc} />
      <PdfCompressor />
      <ToolContent slug="compress-pdf" />
    </>
  );
}
