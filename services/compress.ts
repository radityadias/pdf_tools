import { resolve } from "path";
import { PDFDocument } from "pdf-lib";

export type Preset = "light" | "balanced" | "strong";

const PRESETS: Record<Preset, {scale: number; quality: number}> = {
    light: { scale: 2.0, quality: 0.75 },
    balanced: { scale: 1.5, quality: 0.6 },
    strong: { scale: 1.0, quality: 0.5}
};

export async function compressPdf (
    file: File,
    preset: Preset,
    onProgress?: (done: number, total: number) => void
) : Promise<{ blob: Blob, before: number, after: number}> {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

    const { scale, quality } = PRESETS[preset];
    const src = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const out = await PDFDocument.create();

    for (let i = 1; i <= src.numPages; i++) {
        const page = await src.getPage(i);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
            canvas,
            canvasContext: canvas.getContext("2d")!,
            viewport,
        }).promise;

        const jpeg = await new Promise<Blob>((resolve, reject) => 
            canvas.toBlob(
                (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
                "image/jpeg",
                quality
            )
        );

        const img = await out.embedJpg(await jpeg.arrayBuffer());
        const p = out.addPage([base.width, base.height]);
        p.drawImage(img, { x: 0, y: 0, width: base.width, height: base.height });

    
        canvas.width = canvas.height = 0
        page.cleanup();
        onProgress?.(i, src.numPages);
    }

    const bytes = await out.save({  useObjectStreams: true });
    const compressed = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
    const useOriginal = compressed.size >= file.size;

    console.log("original:", file.size, "rebuilt:", compressed.size, "preset:", preset);

    return {
        blob: useOriginal ? file : compressed,
        before: file.size,
        after: useOriginal ? file.size : compressed.size
    }
}