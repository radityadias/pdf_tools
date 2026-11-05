import Hero from "@/components/Hero";
import PdfSplit from "@/components/PdfSplit";

export default function Split() {
    const heroData = {
        title: "Split PDF",
        desc: "Split a PDF file into two separate PDF files"
    }

    return (
        <>
            <Hero title={heroData.title} desc={heroData.desc} />
            <PdfSplit />
        </>
    )
}