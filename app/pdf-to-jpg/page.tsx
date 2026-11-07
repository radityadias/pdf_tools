import Hero from "@/components/layout/Hero";
import PdfToImage from "@/components/page/PdfToImage";
import JsonLd from "@/components/JsonLd";
import { toolJsonLd, toolMetadata } from "@/lib/seo";

export const metadata = toolMetadata("pdf-to-jpg");

export default function Split() {
  const heroData = {
    title: "PDF to JPG",
    desc: "Convert PDF files into images.",
  };

  return (
    <>
      <JsonLd data={toolJsonLd("pdf-to-jpg")} />
      <Hero title={heroData.title} desc={heroData.desc} />
      <PdfToImage />
    </>
  );
}
