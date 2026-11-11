import { PDFDocument, degrees } from "pdf-lib";

export type Rotation = 0 | 90 | 180 | 270;

/** One tile in the editor. `source` is the zero-based page in the original PDF. */
export type PageItem = {
  id: string;
  source: number;
  rotation: Rotation; // extra rotation added on top of the page's own
  deleted: boolean;
};

/** One page of the output PDF, in order */
export type PageEdit = { source: number; rotation: Rotation };

export const MAX_REORDER_PAGES = 300;

export function initialItems(total: number): PageItem[] {
  return Array.from({ length: total }, (_, i) => ({
    id: `p${i}`,
    source: i,
    rotation: 0,
    deleted: false,
  }));
}

export function rotateBy(current: Rotation, delta: 90 | -90): Rotation {
  return ((current + delta + 360) % 360) as Rotation;
}

/** The pages that will actually be written, in order */
export function toEdits(items: PageItem[]): PageEdit[] {
  return items.filter((i) => !i.deleted).map((i) => ({ source: i.source, rotation: i.rotation }));
}

/** False when the list is identical to the original document */
export function hasChanges(items: PageItem[], total: number): boolean {
  return (
    items.length !== total ||
    items.some((item, i) => item.deleted || item.rotation !== 0 || item.source !== i)
  );
}

export async function reorderPdf(
  file: File,
  edits: PageEdit[],
  opts: { title?: string } = {}
): Promise<{ blob: Blob; pages: number }> {
  if (edits.length === 0) throw new Error("Keep at least one page.");

  let src: PDFDocument;
  try {
    src = await PDFDocument.load(await file.arrayBuffer());
  } catch {
    // pdf-lib throws on encrypted or corrupted PDFs
    throw new Error("Could not read this PDF. It may be password-protected or damaged.");
  }

  const total = src.getPageCount();
  if (edits.some((e) => e.source < 0 || e.source >= total)) {
    throw new Error("The page list doesn't match this PDF. Please reload the file.");
  }

  const out = await PDFDocument.create();

  // One call for all pages, so shared fonts and images are copied only once.
  // The same source page may appear several times (duplicates).
  const copied = await out.copyPages(src, edits.map((e) => e.source));

  copied.forEach((page, i) => {
    const extra = edits[i].rotation;
    if (extra) {
      // Add to the page's existing /Rotate, so scanned pages that are already rotated stay correct
      const angle = (((page.getRotation().angle + extra) % 360) + 360) % 360;
      page.setRotation(degrees(angle));
    }
    out.addPage(page);
  });

  if (opts.title) out.setTitle(opts.title);

  const bytes = await out.save({ useObjectStreams: true });
  return {
    blob: new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
    pages: out.getPageCount(),
  };
}