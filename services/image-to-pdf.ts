import { PDFDocument } from "pdf-lib";

export type PageSize = "a4" | "letter" | "fit";
export type Orientation = "auto" | "portrait" | "landscape";
export type MarginSize = "none" | "small" | "medium";
export type QualityPreset = "high" | "balanced" | "small";
export type Rotation = 0 | 90 | 180 | 270;

export type ImageInput = { file: File; rotation: Rotation };

export type ImageToPdfOptions = {
  pageSize: PageSize;
  orientation: Orientation;
  margin: MarginSize;
  quality: QualityPreset;
  title?: string;
  signal?: AbortSignal;
  onProgress?: (done: number, total: number) => void;
};

// Page sizes in PDF points (1 pt = 1/72 inch)
const PAGE_POINTS = {
  a4: [595.28, 841.89],
  letter: [612, 792],
} as const;

const MARGIN_POINTS: Record<MarginSize, number> = { none: 0, small: 18, medium: 36 };

const QUALITY: Record<QualityPreset, { maxSide: number; jpeg: number; keepPng: boolean }> = {
  high: { maxSide: 4096, jpeg: 0.92, keepPng: true }, // PNGs stay lossless
  balanced: { maxSide: 2000, jpeg: 0.8, keepPng: false },
  small: { maxSide: 1400, jpeg: 0.65, keepPng: false },
};

const MAX_PIXELS = 16_000_000; // iOS Safari caps total canvas pixels
const FIT_LONG_SIDE = 842; // "Fit to image": longer side of the page, in points

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not encode the image."))),
      mime,
      quality
    )
  );
}

/** Reads the image size (after EXIF rotation) and confirms the browser can decode it */
export async function probeImage(file: File): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const size = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return size;
}

type Prepared = { bytes: Uint8Array; kind: "jpg" | "png"; width: number; height: number };

async function prepareImage(
  file: File,
  rotation: Rotation,
  q: (typeof QUALITY)[QualityPreset]
): Promise<Prepared> {
  let bitmap: ImageBitmap;
  try {
    // "from-image" applies the EXIF orientation, so phone photos are not sideways
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(
      `Could not read "${file.name}". Your browser may not support this image format.`
    );
  }

  const canvas = document.createElement("canvas");
  try {
    const sw = bitmap.width;
    const sh = bitmap.height;
    const scale = Math.min(1, q.maxSide / Math.max(sw, sh), Math.sqrt(MAX_PIXELS / (sw * sh)));
    const w = Math.max(1, Math.round(sw * scale));
    const h = Math.max(1, Math.round(sh * scale));
    const quarterTurn = rotation === 90 || rotation === 270;

    canvas.width = quarterTurn ? h : w;
    canvas.height = quarterTurn ? w : h;

    const ctx = canvas.getContext("2d")!;
    const asPng = q.keepPng && file.type === "image/png";

    if (!asPng) {
      // JPEG has no transparency: fill white so transparent areas don't turn black
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(bitmap, -w / 2, -h / 2, w, h);

    const blob = await canvasToBlob(
      canvas,
      asPng ? "image/png" : "image/jpeg",
      asPng ? undefined : q.jpeg
    ).catch(() => {
      throw new Error(`Could not process "${file.name}".`);
    });

    return {
      bytes: new Uint8Array(await blob.arrayBuffer()),
      kind: asPng ? "png" : "jpg",
      width: canvas.width,
      height: canvas.height,
    };
  } finally {
    canvas.width = canvas.height = 0; // free memory
    bitmap.close();
  }
}

function layoutPage(
  size: PageSize,
  orientation: Orientation,
  margin: number,
  imgW: number,
  imgH: number
) {
  // Fit to image: the page has the image's proportions, plus the margin around it
  if (size === "fit") {
    const k = FIT_LONG_SIDE / Math.max(imgW, imgH);
    const dw = imgW * k;
    const dh = imgH * k;
    return { pw: dw + margin * 2, ph: dh + margin * 2, x: margin, y: margin, dw, dh };
  }

  let [pw, ph]: number[] = [...PAGE_POINTS[size]];
  const landscape =
    orientation === "landscape" || (orientation === "auto" && imgW > imgH);
  if (landscape) [pw, ph] = [ph, pw];

  const k = Math.min((pw - margin * 2) / imgW, (ph - margin * 2) / imgH);
  const dw = imgW * k;
  const dh = imgH * k;
  return { pw, ph, x: (pw - dw) / 2, y: (ph - dh) / 2, dw, dh };
}

export async function imagesToPdf(
  inputs: ImageInput[],
  opts: ImageToPdfOptions
): Promise<{ blob: Blob; pages: number }> {
  if (inputs.length === 0) throw new Error("Add at least one image.");

  const out = await PDFDocument.create();
  const q = QUALITY[opts.quality];
  const margin = MARGIN_POINTS[opts.margin];

  for (let i = 0; i < inputs.length; i++) {
    if (opts.signal?.aborted) throw new DOMException("Cancelled", "AbortError");

    const img = await prepareImage(inputs[i].file, inputs[i].rotation, q);
    const embedded =
      img.kind === "png" ? await out.embedPng(img.bytes) : await out.embedJpg(img.bytes);

    const { pw, ph, x, y, dw, dh } = layoutPage(
      opts.pageSize,
      opts.orientation,
      margin,
      img.width,
      img.height
    );
    const page = out.addPage([pw, ph]);
    page.drawImage(embedded, { x, y, width: dw, height: dh });

    opts.onProgress?.(i + 1, inputs.length);
    await new Promise((r) => setTimeout(r, 0)); // let the UI repaint between images
  }

  if (opts.title) out.setTitle(opts.title);

  const bytes = await out.save({ useObjectStreams: true });
  return {
    blob: new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
    pages: out.getPageCount(),
  };
}