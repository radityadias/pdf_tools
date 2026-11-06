import PdfMerge from "@/components/PdfMerge"
import Hero from "@/components/Hero"
import JsonLd from "@/components/JsonLd";
import { toolJsonLd, toolMetadata } from "@/lib/seo";

export const metadata = toolMetadata("merge-pdf");

export default function Merge() {
    const heroData = {
        title: "PDF Merge",
        desc: "Merge two different into one PDF easily"
    }
    
    return (
        <>
            <JsonLd data={toolJsonLd("merge-pdf")} />
            <Hero title={heroData.title} desc={heroData.desc} />
            <PdfMerge />
        </>
    )
}