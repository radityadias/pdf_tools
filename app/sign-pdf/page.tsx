import PdfSign from "@/components/page/PdfSign";
import Hero from "@/components/layout/Hero";
import JsonLd from "@/components/JsonLd";
import ToolContent from "@/components/page/ToolContent";

import { toolJsonLd, toolMetadata } from "@/lib/seo";

export const metadata = toolMetadata("merge-pdf");

export default function MergePage() {
  const heroData = {
    title: "Sign PDF",
    desc: "Add your signature, text and date to a PDF.",
  };

  return (
    <>
      <JsonLd data={toolJsonLd("merge-pdf")} />
      <Hero title={heroData.title} desc={heroData.desc} />
      <PdfSign />
      <ToolContent slug="sign-pdf" />
    </>
  );
}
