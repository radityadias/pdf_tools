import Hero from "@/components/Hero";
import PdfSplit from "@/components/PdfSplit";
import JsonLd from "@/components/JsonLd";
import { toolJsonLd } from "@/lib/seo";

export default function Split() {
    const heroData = {
        title: "Split PDF",
        desc: "Split a PDF file into two separate PDF files"
    }

    return (
        <>
            <JsonLd data={toolJsonLd("split-pdf")} />
            <Hero title={heroData.title} desc={heroData.desc} />
            <PdfSplit />
        </>
    )
}