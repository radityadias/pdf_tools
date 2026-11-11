import Hero from "@/components/layout/Hero";
import PdfSplit from "@/components/page/PdfSplit";
import JsonLd from "@/components/JsonLd";
import ToolContent from "@/components/page/ToolContent";

import { toolJsonLd, toolMetadata } from "@/lib/seo";

export const metadata = toolMetadata("split-pdf");

export default function SplitPage() {
  const heroData = {
    title: "Split PDF",
    desc: "Split a PDF file into two separate PDF files",
  };

  return (
    <>
      <JsonLd data={toolJsonLd("split-pdf")} />
      <Hero title={heroData.title} desc={heroData.desc} />
      <PdfSplit />
      <ToolContent slug="split-pdf" />
    </>
  );
}
