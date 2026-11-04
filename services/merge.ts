import { PDFDocument } from "pdf-lib";

export type MergeOptions = {
  title?: string;
  onProgress?: (done: number, total: number) => void;
};

export type MergeResult = { blob: Blob; pages: number };

export async function mergePdf(
  files: File[],
  opts: MergeOptions = {}
): Promise<MergeResult> {
  if (files.length < 2) {
    throw new Error("Select at least two PDFs to merge.");
  }

  const out = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    let doc: PDFDocument;
    try {
      doc = await PDFDocument.load(await file.arrayBuffer());
    } catch {
      // pdf-lib throws on encrypted or corrupted PDFs
      throw new Error(
        `Could not read "${file.name}". It may be password-protected or damaged.`
      );
    }

    const pages = await out.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => out.addPage(p));

    opts.onProgress?.(i + 1, files.length);
    await new Promise((r) => setTimeout(r, 0)); // let the UI repaint between files
  }

  if (opts.title) out.setTitle(opts.title);

  const bytes = await out.save({ useObjectStreams: true });
  return {
    blob: new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
    pages: out.getPageCount(),
  };
}

/** "my/file:name" -> "my-file-name.pdf" */
export function safeFilename(name: string, fallback = "merged"): string {
  const cleaned = name
    .trim()
    .replace(/\.pdf$/i, "")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .slice(0, 100);
  return `${cleaned || fallback}.pdf`;
}