import { PDFDocument } from "pdf-lib";
import { zipSync } from "fflate";

/** Zero-based page indexes that end up together in one output PDF */
export type PageGroup = number[];
export type SplitFile = { name: string; bytes: Uint8Array };

const baseName = (file: File) => file.name.replace(/\.pdf$/i, "");

/** "1-3, 5, 8-" -> [[0,1,2],[4],[7,8,...,last]] */
export function parseRanges(input: string, totalPages: number): PageGroup[] {
  const tokens = input
    .replace(/[–—]/g, "-")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    throw new Error("Enter at least one page or range, e.g. 1-3, 5, 8-");
  }

  return tokens.map((token) => {
    let start: number;
    let end: number;

    const single = token.match(/^(\d+)$/);
    const range = token.match(/^(\d+)\s*-\s*(\d*)$/);

    if (single) {
      start = end = Number(single[1]);
    } else if (range) {
      start = Number(range[1]);
      end = range[2] ? Number(range[2]) : totalPages; // "8-" = to the end
    } else {
      throw new Error(`"${token}" is not a valid page or range.`);
    }

    if (start < 1 || end > totalPages) {
      throw new Error(`"${token}" is outside this document (pages 1-${totalPages}).`);
    }
    if (start > end) {
      throw new Error(`"${token}" starts after it ends.`);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start - 1 + i);
  });
}

/** Every `size` pages -> one group each */
export function chunkPages(totalPages: number, size: number): PageGroup[] {
  const groups: PageGroup[] = [];
  for (let s = 0; s < totalPages; s += size) {
    const length = Math.min(size, totalPages - s);
    groups.push(Array.from({ length }, (_, i) => s + i));
  }
  return groups;
}

function labelFor(group: PageGroup): string {
  if (group.length === 1) return `page-${group[0] + 1}`;
  const contiguous = group.every((p, i) => i === 0 || p === group[i - 1] + 1);
  return contiguous
    ? `pages-${group[0] + 1}-${group[group.length - 1] + 1}`
    : `${group.length}-pages`;
}

export async function splitPdf(
  file: File,
  groups: PageGroup[],
  onProgress?: (done: number, total: number) => void
): Promise<SplitFile[]> {
  const src = await PDFDocument.load(await file.arrayBuffer());
  const base = baseName(file);
  const pad = String(groups.length).length;
  const files: SplitFile[] = [];

  for (let i = 0; i < groups.length; i++) {
    const out = await PDFDocument.create();
    const pages = await out.copyPages(src, groups[i]);
    pages.forEach((p) => out.addPage(p));
    const bytes = await out.save({ useObjectStreams: true });

    // The index prefix keeps names unique and sorted inside the ZIP
    const prefix = groups.length > 1 ? `_${String(i + 1).padStart(pad, "0")}` : "";
    files.push({ name: `${base}${prefix}_${labelFor(groups[i])}.pdf`, bytes });

    onProgress?.(i + 1, groups.length);
    await new Promise((r) => setTimeout(r, 0)); // let the UI repaint
  }

  return files;
}

/** One file -> plain PDF. Several files -> ZIP. */
export function packFiles(
  files: SplitFile[],
  file: File
): { blob: Blob; filename: string } {
  if (files.length === 1) {
    return {
      blob: new Blob([new Uint8Array(files[0].bytes)], { type: "application/pdf" }),
      filename: files[0].name,
    };
  }

  // level 0: PDFs are already compressed, so deflating again only wastes time
  const zipped = zipSync(
    Object.fromEntries(files.map((f) => [f.name, f.bytes])),
    { level: 0 }
  );

  return {
    blob: new Blob([new Uint8Array(zipped)], { type: "application/zip" }),
    filename: `${baseName(file)}_split.zip`,
  };
}