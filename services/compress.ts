import { PDFDocument } from "pdf-lib";

export type Preset = "light" | "balanced" | "strong";

export type Goal =
  | { kind: "preset"; preset: Preset }
  | { kind: "target"; targetKB: number };

export type CompressProgress = { fraction: number; status: string };

export type CompressOptions = {
  goal: Goal;
  grayscale?: boolean;
  signal?: AbortSignal;
  onProgress?: (progress: CompressProgress) => void;
};

/**
 * compressed     the result is smaller (and under the target, in target mode)
 * already-small  the original was already under the target
 * no-gain        rebuilding would not make the file smaller, so the original is kept
 * target-missed  the closest result is still over the target
 */
export type Outcome = "compressed" | "already-small" | "no-gain" | "target-missed";

export type CompressResult = {
  blob: Blob;
  before: number;
  after: number;
  outcome: Outcome;
  targetBytes?: number;
  pages?: number;
  /** Approximate resolution of the result (72 = typical screen resolution) */
  dpi?: number;
};

type Level = { scale: number; quality: number };

// From lightest (best quality) to smallest. The presets are entries of this ladder.
const LEVELS: Level[] = [
  { scale: 2.0, quality: 0.8 }, // 0  light
  { scale: 1.75, quality: 0.72 },
  { scale: 1.5, quality: 0.65 }, // 2  balanced
  { scale: 1.3, quality: 0.58 },
  { scale: 1.15, quality: 0.52 },
  { scale: 1.0, quality: 0.48 }, // 5  strong
  { scale: 0.85, quality: 0.44 },
  { scale: 0.72, quality: 0.4 },
  { scale: 0.6, quality: 0.36 },
  { scale: 0.5, quality: 0.32 }, // 9  smallest
];
const LAST = LEVELS.length - 1;
const PRESET_LEVEL: Record<Preset, number> = { light: 0, balanced: 2, strong: 5 };

export const MAX_PAGES = 300;
export const MIN_TARGET_KB = 20;
export const MAX_TARGET_KB = 10 * 1024;
const MAX_CANVAS_PIXELS = 16_000_000; // stops iOS Safari from refusing huge canvases

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not encode a page."))),
      "image/jpeg",
      quality
    )
  );
}

function toGrayscale(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) | 0;
    d[i] = d[i + 1] = d[i + 2] = g;
  }
  ctx.putImageData(img, 0, 0);
}

/** Encodes the rendered page at one level, scaling it down from the render if needed */
async function encodeLevel(src: HTMLCanvasElement, level: Level, renderScale: number) {
  const factor = Math.min(level.scale, renderScale) / renderScale;
  if (factor >= 0.999) return canvasToJpeg(src, level.quality);

  const small = document.createElement("canvas");
  small.width = Math.max(1, Math.round(src.width * factor));
  small.height = Math.max(1, Math.round(src.height * factor));
  const ctx = small.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, small.width, small.height);
  try {
    return await canvasToJpeg(small, level.quality);
  } finally {
    small.width = small.height = 0;
  }
}

async function buildPdf(sizes: { w: number; h: number }[], jpegs: Blob[]): Promise<Blob> {
  const out = await PDFDocument.create();
  for (let i = 0; i < jpegs.length; i++) {
    const img = await out.embedJpg(await jpegs[i].arrayBuffer());
    const page = out.addPage([sizes[i].w, sizes[i].h]); // keep the original page size
    page.drawImage(img, { x: 0, y: 0, width: sizes[i].w, height: sizes[i].h });
  }
  const bytes = await out.save({ useObjectStreams: true });
  return new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
}

export async function compressPdf(file: File, opts: CompressOptions): Promise<CompressResult> {
  const { goal, grayscale = false, signal, onProgress } = opts;
  const before = file.size;
  const targetBytes = goal.kind === "target" ? Math.round(goal.targetKB * 1024) : undefined;

  if (targetBytes !== undefined && before <= targetBytes) {
    return { blob: file, before, after: before, outcome: "already-small", targetBytes };
  }

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() });

  try {
    let pdf: Awaited<typeof loadingTask.promise>;
    try {
      pdf = await loadingTask.promise;
    } catch {
      throw new Error("Could not read this PDF. It may be password-protected or damaged.");
    }

    const total = pdf.numPages;
    if (total > MAX_PAGES) {
      throw new Error(
        `This PDF has ${total} pages, and the compressor supports up to ${MAX_PAGES}. Split it first with Split PDF.`
      );
    }

    const wanted = goal.kind === "preset" ? [PRESET_LEVEL[goal.preset]] : LEVELS.map((_, i) => i);
    let alive = [...wanted]; // ascending, so alive[0] is the lightest level still in the running
    const blobs: Blob[][] = LEVELS.map(() => []);
    const totals: number[] = LEVELS.map(() => 0);
    const sizes: { w: number; h: number }[] = [];

    for (let i = 0; i < total; i++) {
      throwIfAborted(signal);
      onProgress?.({ fraction: (i / total) * 0.9, status: `Processing page ${i + 1} of ${total}` });

      const page = await pdf.getPage(i + 1);
      const unit = page.getViewport({ scale: 1 });
      sizes.push({ w: unit.width, h: unit.height });

      // Render once at the lightest level still in the running; the others scale down from it
      const topScale = LEVELS[alive[0]].scale;
      const renderScale = Math.min(topScale, Math.sqrt(MAX_CANVAS_PIXELS / (unit.width * unit.height)));
      const viewport = page.getViewport({ scale: renderScale });

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      const ctx = canvas.getContext("2d")!;

      try {
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        if (grayscale) toGrayscale(ctx, canvas.width, canvas.height);

        for (const li of alive) {
          const blob = await encodeLevel(canvas, LEVELS[li], renderScale);
          blobs[li].push(blob);
          totals[li] += blob.size;
        }
      } finally {
        canvas.width = canvas.height = 0; // free memory
        page.cleanup();
      }

      // A level already over the target can never fit later: drop it and free its pages.
      // The smallest level always stays as the fallback.
      if (targetBytes !== undefined) {
        alive = alive.filter((li) => {
          const keep = li === LAST || totals[li] <= targetBytes;
          if (!keep) blobs[li] = [];
          return keep;
        });
      }
    }

    throwIfAborted(signal);
    onProgress?.({ fraction: 0.92, status: "Building the PDF…" });

    const dpiOf = (li: number) => Math.round(LEVELS[li].scale * 72);

    // Preset mode: one level, no search
    if (goal.kind === "preset") {
      const li = wanted[0];
      const blob = await buildPdf(sizes, blobs[li]);
      onProgress?.({ fraction: 1, status: "Done" });
      if (blob.size >= before) {
        return { blob: file, before, after: before, outcome: "no-gain", pages: total };
      }
      return { blob, before, after: blob.size, outcome: "compressed", pages: total, dpi: dpiOf(li) };
    }

    // Target mode: try the highest-quality level that could fit, and verify by building it
    const target = targetBytes!;
    const fitting = alive.filter((li) => totals[li] <= target);
    let best: { li: number; blob: Blob } | null = null;

    for (const li of fitting) {
      throwIfAborted(signal);
      onProgress?.({ fraction: 0.95, status: "Checking the size…" });

      const blob = await buildPdf(sizes, blobs[li]);
      if (blob.size <= target) {
        onProgress?.({ fraction: 1, status: "Done" });
        return {
          blob,
          before,
          after: blob.size,
          outcome: "compressed",
          targetBytes: target,
          pages: total,
          dpi: dpiOf(li),
        };
      }
      if (!best || blob.size < best.blob.size) best = { li, blob };
    }

    // Nothing fits. Use the smallest level and report how close it got.
    if (!fitting.includes(LAST)) {
      const blob = await buildPdf(sizes, blobs[LAST]);
      if (!best || blob.size < best.blob.size) best = { li: LAST, blob };
    }
    if (!best) throw new Error("Compression failed. Please try again.");

    onProgress?.({ fraction: 1, status: "Done" });

    if (best.blob.size >= before) {
      return { blob: file, before, after: before, outcome: "no-gain", targetBytes: target, pages: total };
    }
    return {
      blob: best.blob,
      before,
      after: best.blob.size,
      outcome: "target-missed",
      targetBytes: target,
      pages: total,
      dpi: dpiOf(best.li),
    };
  } finally {
    await loadingTask.destroy();
  }
}