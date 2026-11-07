import ImageToPdf from "@/components/page/ImageToPdf";
import JsonLd from "@/components/JsonLd";
import Hero from "@/components/layout/Hero";
import { toolJsonLd, toolMetadata } from "@/lib/seo";

export const metadata = toolMetadata("jpg-to-pdf");

export default function JpgToPdfPage() {
  const heroData = {
    title: "Image to PDF",
    desc: "Turn JPG, PNG and other images into a single PDF.",
  };

  return (
    <>
      <JsonLd data={toolJsonLd("jpg-to-pdf")} />
      <Hero title={heroData.title} desc={heroData.desc} />
      <ImageToPdf />
    </>
  );
}
