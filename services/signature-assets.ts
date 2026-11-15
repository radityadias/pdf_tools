import type { SignatureAsset } from "@/services/sign";

export type Point = { x: number; y: number };
export type Stroke = Point[];

export const PAD_WIDTH = 1000;
export const PAD_HEIGHT = 360;
export const PEN_WIDTH = 5;

const EXPORT_SCALE = 2;
const NOMINAL_PAGE_PT = 600; // about the width of an A4 page, used to size text stamps

export const INK_COLORS = [
  { value: "#111827", label: "Black" },
  { value: "#1d4ed8", label: "Blue" },
  { value: "#b91c1c", label: "Red" },
];

let counter = 0;
export function newId(prefix: string) {
  counter += 1;
  return `${prefix}${Date.now().toString(36)}${counter.toString(36)}`;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** A signature about 40 pt tall looks natural, so wider images start wider */
const signatureWidth = (aspect: number) => clamp(aspect * 0.07, 0.18, 0.5);

/** Draws one stroke as a smooth curve through the midpoints of its points */
export function drawStroke(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string,
  width: number
) {
  if (points.length === 0) return;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, width / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i++) {
    const mx = (points[i].x + points[i + 1].x) / 2;
    const my = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, mx, my);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
}

/** Crops transparent margins. Returns null when the canvas is empty. */
function trimToContent(src: HTMLCanvasElement, pad: number): HTMLCanvasElement | null {
  const { width, height } = src;
  const data = src.getContext("2d")!.getImageData(0, 0, width, height).data;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;

  const x0 = Math.max(0, minX - pad);
  const y0 = Math.max(0, minY - pad);
  const x1 = Math.min(width, maxX + pad + 1);
  const y1 = Math.min(height, maxY + pad + 1);

  const out = document.createElement("canvas");
  out.width = x1 - x0;
  out.height = y1 - y0;
  out.getContext("2d")!.drawImage(src, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

function toAsset(
  canvas: HTMLCanvasElement,
  kind: SignatureAsset["kind"],
  label: string,
  defaultW: number
): SignatureAsset {
  return {
    id: newId("a"),
    kind,
    label,
    dataUrl: canvas.toDataURL("image/png"),
    aspect: canvas.width / canvas.height,
    defaultW,
  };
}

export function createDrawnAsset(strokes: Stroke[], color: string): SignatureAsset | null {
  if (strokes.length === 0) return null;

  const canvas = document.createElement("canvas");
  canvas.width = PAD_WIDTH * EXPORT_SCALE;
  canvas.height = PAD_HEIGHT * EXPORT_SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(EXPORT_SCALE, EXPORT_SCALE);
  for (const s of strokes) drawStroke(ctx, s, color, PEN_WIDTH);

  const trimmed = trimToContent(canvas, 8 * EXPORT_SCALE);
  if (!trimmed) return null;
  return toAsset(trimmed, "signature", "Drawn signature", signatureWidth(trimmed.width / trimmed.height));
}

export async function createTypedAsset(
  text: string,
  family: string,
  color: string
): Promise<SignatureAsset | null> {
  const value = text.trim();
  if (!value) return null;

  const size = 140;
  await document.fonts.load(`${size}px ${family}`, value); // make sure the font is ready

  const probe = document.createElement("canvas").getContext("2d")!;
  probe.font = `${size}px ${family}`;
  const textWidth = probe.measureText(value).width;

  const canvas = document.createElement("canvas");
  canvas.width = Math.min(4000, Math.ceil(textWidth) + 120);
  canvas.height = size * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.font = `${size}px ${family}`;
  ctx.fillStyle = color;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(value, 60, size * 1.4);

  const trimmed = trimToContent(canvas, 10);
  if (!trimmed) return null;
  return toAsset(trimmed, "signature", value, signatureWidth(trimmed.width / trimmed.height));
}

/** Plain text or a date, rendered as an image so any characters work */
export function createTextStamp(text: string, color: string, pt: number): SignatureAsset | null {
  const value = text.trim();
  if (!value) return null;

  const px = 64;
  const font = `${px}px Arial, Helvetica, sans-serif`;
  const probe = document.createElement("canvas").getContext("2d")!;
  probe.font = font;
  const textWidth = probe.measureText(value).width;

  const canvas = document.createElement("canvas");
  canvas.width = Math.min(4000, Math.ceil(textWidth) + 40);
  canvas.height = px * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(value, 20, px * 1.3);

  const trimmed = trimToContent(canvas, 6);
  if (!trimmed) return null;

  // Start at roughly the chosen point size on a page that is NOMINAL_PAGE_PT wide
  const defaultW = clamp(((textWidth / px) * pt) / NOMINAL_PAGE_PT, 0.05, 0.7);
  return toAsset(trimmed, "text", value, defaultW);
}

export async function loadUploadBitmap(file: File): Promise<ImageBitmap> {
  try {
    // "from-image" applies EXIF rotation, so phone photos are not sideways
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Could not read this image. Try a JPG or PNG.");
  }
}

export function assetFromBitmap(
  bitmap: ImageBitmap,
  opts: { clean: boolean; threshold: number; color: string }
): SignatureAsset | null {
  const k = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * k));
  const h = Math.max(1, Math.round(bitmap.height * k));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);

  if (opts.clean) {
    // Dark pixels become ink in the chosen colour, light pixels (paper) become transparent
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    const [r, g, b] = hexToRgb(opts.color);
    const t = opts.threshold;
    for (let i = 0; i < d.length; i += 4) {
      const lum = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
      const alpha = lum >= t ? 0 : Math.min(255, (255 * (t - lum)) / (t * 0.6));
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
      d[i + 3] = Math.min(alpha, d[i + 3]); // keep any transparency the image already had
    }
    ctx.putImageData(img, 0, 0);
  }

  const trimmed = trimToContent(canvas, 6);
  if (!trimmed) return null;
  return toAsset(trimmed, "signature", "Uploaded signature", signatureWidth(trimmed.width / trimmed.height));
}