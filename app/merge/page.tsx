import PdfMerge from "@/components/PdfMerge"
import Hero from "@/components/Hero"

export default function Merge() {
    const heroData = {
        title: "PDF Merge",
        desc: "Merge two different into one PDF easily"
    }
    
    return (
        <>
            <Hero title={heroData.title} desc={heroData.desc} />
            <PdfMerge />
        </>
    )
}