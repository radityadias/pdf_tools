import PdfMerge from "@/components/page/PdfMerge";
import Hero from "@/components/layout/Hero";
import JsonLd from "@/components/JsonLd";
import ToolContent from "@/components/page/ToolContent";

import { toolJsonLd, toolMetadata } from "@/lib/seo";

export const metadata = toolMetadata("merge-pdf");

export default function MergePage() {
  const heroData = {
    title: "PDF Merge",
    desc: "Merge two different into one PDF easily",
  };

  return (
    <>
      <JsonLd data={toolJsonLd("merge-pdf")} />
      <Hero title={heroData.title} desc={heroData.desc} />
      <PdfMerge />
      <ToolContent slug="merge-pdf" />
    </>
  );
}
