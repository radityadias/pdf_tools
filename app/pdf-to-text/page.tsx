import Hero from "@/components/layout/Hero";
import PdfToText from "@/components/page/PdfToText";
import JsonLd from "@/components/JsonLd";
import ToolContent from "@/components/page/ToolContent";

import { toolJsonLd, toolMetadata } from "@/lib/seo";

export const metadata = toolMetadata("pdf-to-text");

export default function PdfToTextPage() {
  const heroData = {
    title: "PDF to Text",
    desc: "Extract text from PDFs, including scanned pages with OCR.",
  };

  return (
    <>
      <JsonLd data={toolJsonLd("pdf-to-text")} />
      <Hero title={heroData.title} desc={heroData.desc} />
      <PdfToText />
      <ToolContent slug="pdf-to-text" />
    </>
  );
}
