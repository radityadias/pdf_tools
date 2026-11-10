import { zipSync } from "fflate";

export type ImageFormat = "png" | "jpeg" | "webp";

export type RenderedPage = {
  pageNumber: number; // 1-based
  name: string;
  blob: Blob;
  width: number;
  height: number;
  /** true if the page was rendered smaller than requested to stay within browser canvas limits */
  limited: boolean;
};

export type RenderOptions = {
  pages: number[]; // zero-based indexes
  format: ImageFormat;
  dpi: number;
  quality: number; // 0-1, used by jpeg and webp only
  signal?: AbortSignal;
  onProgress?: (done: number, total: number) => void;
  onPage?: (page: RenderedPage) => void;
};

export const MAX_PAGES_PER_RUN = 100;

// Canvas limits: iOS Safari caps total pixels (~16.7M), desktop browsers cap each side
const MAX_SIDE = 8192;
const MAX_PIXELS = 16_000_000;

const MIME: Record<ImageFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const baseName = (file: File) => file.name.replace(/\.pdf$/i, "");

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not encode the image."))),
      mime,
      quality
    )
  );
}

export async function renderPdfPages(file: File, opts: RenderOptions): Promise<RenderedPage[]> {
  const { pages, format, dpi, quality, signal, onProgress, onPage } = opts;

  if (pages.length === 0) throw new Error("Select at least one page.");
  if (pages.length > MAX_PAGES_PER_RUN) {
    throw new Error(`Convert at most ${MAX_PAGES_PER_RUN} pages at a time.`);
  }

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() });
  const results: RenderedPage[] = [];

  try {
    const pdf = await loadingTask.promise;
    const pad = String(pdf.numPages).length;
    const base = baseName(file);

    for (let i = 0; i < pages.length; i++) {
      if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");

      const pageNumber = pages[i] + 1;
      const page = await pdf.getPage(pageNumber);

      // 1 PDF point = 1/72 inch, so dpi / 72 is the scale
      const unit = page.getViewport({ scale: 1 });
      const wanted = dpi / 72;
      const scale = Math.min(
        wanted,
        MAX_SIDE / Math.max(unit.width, unit.height),
        Math.sqrt(MAX_PIXELS / (unit.width * unit.height))
      );
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff"; // JPG has no transparency, and white is what people expect
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvas, canvasContext: ctx, viewport }).promise;

      const blob = await canvasToBlob(canvas, MIME[format], quality);
      const ext = EXT[blob.type] ?? "png";

      const rendered: RenderedPage = {
        pageNumber,
        name: `${base}_page-${String(pageNumber).padStart(pad, "0")}.${ext}`,
        blob,
        width: canvas.width,
        height: canvas.height,
        limited: scale < wanted - 1e-6,
      };

      results.push(rendered);
      onPage?.(rendered);
      onProgress?.(i + 1, pages.length);

      canvas.width = canvas.height = 0; // free memory
      page.cleanup();
      await new Promise((r) => setTimeout(r, 0)); // let the UI repaint
    }

    return results;
  } finally {
    await loadingTask.destroy();
  }
}

/** Images are already compressed, so the ZIP just stores them (level 0) */
export async function zipImages(pages: RenderedPage[]): Promise<Blob> {
  const entries: Record<string, Uint8Array> = {};
  for (const p of pages) {
    entries[p.name] = new Uint8Array(await p.blob.arrayBuffer());
  }
  const zipped = zipSync(entries, { level: 0 });
  return new Blob([new Uint8Array(zipped)], { type: "application/zip" });
}