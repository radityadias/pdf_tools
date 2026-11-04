import Hero from "@/components/Hero";
import PdfCompressor from "@/components/PdfCompressor";

export default function Compress() {
    const heroData = {
        title: 'Compress PDF',
        desc: 'Reduce your PDF File to smaller size'
    }
    
    return (
        <>
            <Hero title={heroData.title} desc={heroData.desc} />
            <PdfCompressor />
        </>
    )
}