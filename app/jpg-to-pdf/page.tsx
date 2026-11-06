import ImageToPdf from "@/components/ImageToPdf";
import JsonLd from "@/components/JsonLd";
import Hero from "@/components/Hero";
import { toolJsonLd, toolMetadata } from "@/lib/seo";

export const metadata = toolMetadata("jpg-to-pdf");

export default function JpgToPdfPage() {
  const heroData = {
    title: "Image to PDF",
    desc: "Turn JPG, PNG and other images into a single PDF.",
  };

  return (
    <main>
      <JsonLd data={toolJsonLd("jpg-to-pdf")} />
      <Hero title={heroData.title} desc={heroData.desc} />
      <ImageToPdf />
    </main>
  );
}
