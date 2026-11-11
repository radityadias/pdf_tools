import Hero from "@/components/layout/Hero";
import PdfReorder from "@/components/page/PdfReorder";
import JsonLd from "@/components/JsonLd";
import ToolContent from "@/components/page/ToolContent";

import { toolJsonLd, toolMetadata } from "@/lib/seo";

export const metadata = toolMetadata("reorder-pdf");

export default function Reorder() {
  const heroData = {
    title: "Reorder PDF",
    desc: "Rearrange, rotate, duplicate and delete PDF pages.",
  };

  return (
    <>
      <JsonLd data={toolJsonLd("split-pdf")} />
      <Hero title={heroData.title} desc={heroData.desc} />
      <PdfReorder />
      <ToolContent slug="reorder-pdf" />
    </>
  );
}
