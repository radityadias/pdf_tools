import type { PDFPageProxy } from "pdfjs-dist";
import { checkPageText, type OcrReason } from "./page-check";

type TesseractWorker = Awaited<ReturnType<typeof import("tesseract.js").createWorker>>;

type Item = { str: string; transform: number[]; width: number; height: number; hasEOL: boolean };

export type OcrMode = "auto" | "text" | "ocr";

/** To add a language, add its .traineddata file to public/tesseract/lang/ and list it here */
export const OCR_LANGUAGES = [
  { value: "eng", label: "English" },
  { value: "ind", label: "Indonesian" },
  { value: "eng+ind", label: "English + Indonesian" },
];

export const MAX_PAGES = 500; // text extraction is cheap
export const MAX_OCR_PAGES = 30; // OCR takes seconds per page

const OCR_DPI = 200; // PDF points are 1/72 inch, so scale = dpi / 72
const MAX_CANVAS_PIXELS = 16_000_000; // stops iOS Safari from refusing huge canvases

const OCR_PATHS = {
  workerPath: "/tesseract/worker.min.js",
  corePath: "/tesseract/core",
  langPath: "/tesseract/lang",
};

export type ExtractProgress = { fraction: number; status: string };

export type ExtractOptions = {
  pages: number[]; // zero-based
  mode: OcrMode;
  langs: string; // Tesseract codes joined with "+": "eng", "ind" or "eng+ind"
  signal?: AbortSignal;
  onProgress?: (progress: ExtractProgress) => void;
};

export type PageText = {
  pageNumber: number; // 1-based
  text: string;
  method: "text" | "ocr";
  /** Why Auto mode chose OCR for this page (only set when it did) */
  reason?: OcrReason;
};

type Draft = { pageNumber: number; text: string; ocr: boolean; reason?: OcrReason };

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
}

export async function extractPdfText(file: File, opts: ExtractOptions): Promise<PageText[]> {
  const { pages, mode, langs, signal, onProgress } = opts;

  if (pages.length === 0) throw new Error("Select at least one page.");
  if (pages.length > MAX_PAGES) throw new Error(`Extract at most ${MAX_PAGES} pages at a time.`);

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() });

  // Terminating the worker is the only way to interrupt a page that is mid-recognition
  let worker: TesseractWorker | null = null;
  const stopWorker = () => {
    worker?.terminate().catch(() => {});
  };
  signal?.addEventListener("abort", stopWorker, { once: true });

  try {
    const pdf = await loadingTask.promise;
    const drafts: Draft[] = [];
    // Share of the progress bar used by phase 1 (reading text layers)
    const textWeight = mode === "text" ? 1 : mode === "auto" ? 0.1 : 0;

    // Phase 1: read the text layer and decide which pages need OCR
    for (let i = 0; i < pages.length; i++) {
      throwIfAborted(signal);

      const pageNumber = pages[i] + 1;
      let text = "";
      let ocr = mode === "ocr";
      let reason: OcrReason | undefined;

      if (mode !== "ocr") {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        const items = content.items.filter((item) => "str" in item) as Item[];
        text = itemsToText(items);
        page.cleanup();

        if (mode === "auto") {
          const check = checkPageText(text);
          ocr = check.needsOcr;
          reason = check.reason;
        }
      }

      drafts.push({ pageNumber, text, ocr, reason });
      onProgress?.({
        fraction: ((i + 1) / pages.length) * textWeight,
        status: `Reading page ${i + 1} of ${pages.length}`,
      });
    }

    const toOcr = drafts.filter((d) => d.ocr);
    if (toOcr.length > MAX_OCR_PAGES) {
      throw new Error(
        `${toOcr.length} pages need OCR, and the limit is ${MAX_OCR_PAGES} per run. Choose a smaller page range.`
      );
    }

    // Phase 2: OCR only the pages that need it, reusing one worker
    if (toOcr.length > 0) {
      onProgress?.({ fraction: textWeight, status: "Loading OCR engine…" });

      let current = 0; // read by the logger below, so it must live outside the loop
      const { createWorker } = await import("tesseract.js");

      try {
        worker = await createWorker(langs, 1, {
          ...OCR_PATHS,
          gzip: false, // the .traineddata files are hosted uncompressed
          logger: (m) => {
            if (m.status !== "recognizing text") return;
            onProgress?.({
              fraction: textWeight + ((current + m.progress) / toOcr.length) * (1 - textWeight),
              status: `Recognizing page ${toOcr[current].pageNumber} (${current + 1} of ${toOcr.length})`,
            });
          },
        });
      } catch {
        throwIfAborted(signal);
        throw new Error("Could not load the OCR engine files. Please reload the page and try again.");
      }

      for (; current < toOcr.length; current++) {
        throwIfAborted(signal);

        const draft = toOcr[current];
        const page = await pdf.getPage(draft.pageNumber);
        const canvas = await renderPageToCanvas(page);
        try {
          const { data } = await worker.recognize(canvas);
          draft.text = data.text.trim();
        } finally {
          canvas.width = canvas.height = 0; // free memory only after recognize is done
          page.cleanup();
        }
      }
    }

    return drafts.map((d) => ({
      pageNumber: d.pageNumber,
      text: d.text,
      method: d.ocr ? "ocr" : "text",
      reason: d.reason,
    }));
  } catch (e) {
    // Terminating the worker makes recognize() reject, so report a cancel as a cancel
    if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
    throw e;
  } finally {
    signal?.removeEventListener("abort", stopWorker);
    await loadingTask.destroy();
    try {
      await worker?.terminate();
    } catch {
      // already terminated
    }
  }
}

async function renderPageToCanvas(page: PDFPageProxy): Promise<HTMLCanvasElement> {
  const unit = page.getViewport({ scale: 1 });
  const scale = Math.min(OCR_DPI / 72, Math.sqrt(MAX_CANVAS_PIXELS / (unit.width * unit.height)));
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  await page.render({
    canvas,
    canvasContext: canvas.getContext("2d")!,
    viewport,
  }).promise;

  return canvas; // the caller frees it after OCR
}

/** Rebuilds readable lines and paragraphs from pdf.js text fragments */
function itemsToText(items: Item[]): string {
  let out = "";
  let lastY: number | null = null;
  let lastEnd = 0;

  for (const item of items) {
    if (!item.str && !item.hasEOL) continue;

    const x = item.transform[4];
    const y = item.transform[5];
    const size = item.height || Math.abs(item.transform[3]) || 10;

    if (lastY !== null) {
      const dy = Math.abs(y - lastY);

      if (dy > size * 0.6) out += dy > size * 1.8 ? "\n\n" : "\n"; // new line / new paragraph
      else if (x - lastEnd > size * 0.15 && !out.endsWith(" ")) out += " "; // missing space
    }

    out += item.str;
    lastY = y;
    lastEnd = x + item.width;
  }

  return out.trim();
}

/** Joins the pages into one string, optionally with "--- Page N ---" separators */
export function joinPages(pages: PageText[], separators: boolean): string {
  const parts = separators
    ? pages.map((p) => `--- Page ${p.pageNumber} ---\n\n${p.text}`.trimEnd())
    : pages.map((p) => p.text).filter(Boolean); // skip empty pages so no stacks of blank lines
  return parts.join("\n\n");
}

/** [1,2,3,5] -> "1-3, 5" */
export function formatPageList(nums: number[]): string {
  const out: string[] = [];
  let i = 0;
  while (i < nums.length) {
    let j = i;
    while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++;
    out.push(j > i ? `${nums[i]}-${nums[j]}` : String(nums[i]));
    i = j + 1;
  }
  return out.join(", ");
}