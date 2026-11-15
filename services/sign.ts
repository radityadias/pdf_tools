import { PDFDocument, degrees, type PDFImage } from "pdf-lib";

export type SignatureAsset = {
  id: string;
  kind: "signature" | "text";
  label: string;
  dataUrl: string; // transparent PNG
  aspect: number; // width / height
  defaultW: number; // starting width as a fraction of the page width
};

/** x, y, w are fractions of the page as displayed (rotation applied). y counts from the top. */
export type PlacedItem = {
  id: string;
  page: number; // zero-based
  assetId: string;
  x: number;
  y: number;
  w: number;
};

export const MAX_SIGN_PAGES = 500;

type Box = { x: number; y: number; width: number; height: number };

/** Converts a position on the displayed page into pdf-lib drawImage coordinates */
export function placement(
  box: Box,
  rotation: number,
  item: { x: number; y: number; w: number },
  aspect: number
) {
  const quarter = rotation === 90 || rotation === 270;
  const vw = quarter ? box.height : box.width; // displayed page size in points
  const vh = quarter ? box.width : box.height;

  const width = item.w * vw;
  const height = width / aspect;
  const xv = item.x * vw;
  const yv = item.y * vh;

  // The image's own origin is its bottom-left corner. The rotation turns the image so
  // that it appears upright on the displayed page.
  switch (rotation) {
    case 90:
      return { x: box.x + yv + height, y: box.y + xv, width, height, rotate: 90 };
    case 180:
      return { x: box.x + box.width - xv, y: box.y + yv + height, width, height, rotate: 180 };
    case 270:
      return {
        x: box.x + box.width - yv - height,
        y: box.y + box.height - xv,
        width,
        height,
        rotate: 270,
      };
    default:
      return { x: box.x + xv, y: box.y + box.height - yv - height, width, height, rotate: 0 };
  }
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const binary = atob(dataUrl.slice(dataUrl.indexOf(",") + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function signPdf(
  file: File,
  items: PlacedItem[],
  assets: SignatureAsset[]
): Promise<{ blob: Blob; signedPages: number }> {
  if (items.length === 0) throw new Error("Place at least one signature or text on a page.");

  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(await file.arrayBuffer());
  } catch {
    // pdf-lib throws on encrypted or corrupted PDFs
    throw new Error("Could not open this PDF. It may be password-protected or damaged.");
  }

  const pages = doc.getPages();
  const byId = new Map(assets.map((a) => [a.id, a]));
  const embedded = new Map<string, PDFImage>();

  for (const item of items) {
    const asset = byId.get(item.assetId);
    const page = pages[item.page];
    if (!asset || !page) {
      throw new Error("The signatures don't match this PDF. Please reload the file and try again.");
    }

    let image = embedded.get(asset.id);
    if (!image) {
      image = await doc.embedPng(dataUrlToBytes(asset.dataUrl)); // each image is embedded once
      embedded.set(asset.id, image);
    }

    const angle = ((page.getRotation().angle % 360) + 360) % 360;
    const rotation = angle === 90 || angle === 180 || angle === 270 ? angle : 0;
    const p = placement(page.getCropBox(), rotation, item, asset.aspect);

    page.drawImage(image, {
      x: p.x,
      y: p.y,
      width: p.width,
      height: p.height,
      rotate: degrees(p.rotate),
    });
  }

  const bytes = await doc.save();
  return {
    blob: new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
    signedPages: new Set(items.map((i) => i.page)).size,
  };
}