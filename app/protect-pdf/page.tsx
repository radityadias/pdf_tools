import PdfProtect from "@/components/page/PdfProtect";
import Hero from "@/components/layout/Hero";
import JsonLd from "@/components/JsonLd";
import ToolContent from "@/components/page/ToolContent";

import { toolJsonLd, toolMetadata } from "@/lib/seo";

export const metadata = toolMetadata("protect-pdf");

export default function ProtectPage() {
  const heroData = {
    title: "Protect PDF",
    desc: "Add a password to a PDF and control printing, copying and editing.",
  };

  return (
    <>
      <JsonLd data={toolJsonLd("protect-pdf")} />
      <Hero title={heroData.title} desc={heroData.desc} />
      <PdfProtect />
      <ToolContent slug="protect-pdf" />
    </>
  );
}
