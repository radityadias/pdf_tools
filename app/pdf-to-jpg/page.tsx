"use client";

import Hero from "@/components/Hero";
import PdfToImage from "@/components/PdfToImage";
import JsonLd from "@/components/JsonLd";
import { toolJsonLd } from "@/lib/seo";

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
