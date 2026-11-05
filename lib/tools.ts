import { Combine, Minimize2, Scissors, Images,  type LucideIcon } from "lucide-react";

export type Tool = {
  slug: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  metaTitle: string;
  metaDescription: string;
};

export const TOOLS: Tool[] = [
  {
    slug: "compress-pdf",
    title: "Compress PDF",
    desc: "Reduce the file size of scanned or image-heavy PDFs.",
    icon: Minimize2,
    metaTitle: "Compress PDF Online Free: Reduce PDF File Size",
    metaDescription:
      "Compress PDF files online for free. Shrink scanned and image-heavy PDFs right in your browser. No upload, no signup.",
  },
  {
    slug: "merge-pdf",
    title: "Merge PDF",
    desc: "Combine several PDFs into one, in the order you want.",
    icon: Combine,
    metaTitle: "Merge PDF Online Free: Combine PDF Files",
    metaDescription:
      "Merge multiple PDF files into one document for free. Drag to reorder, preview pages and download. Works in your browser, no upload.",
  },
  {
    slug: "split-pdf",
    title: "Split PDF",
    desc: "Extract pages or cut a PDF into separate files.",
    icon: Scissors,
    metaTitle: "Split PDF Online Free: Extract Pages from PDF",
    metaDescription:
      "Split a PDF by page range, every N pages, or by selecting pages visually. Free, private and runs in your browser.",
  },
  {
    slug: "pdf-to-jpg",
    title: "PDF to JPG",
    desc: "Convert PDF files into images.",
    icon: Images,
    metaTitle: "Convert PDF Online Free: Convert PDF files into images",
    metaDescription:
      "Convert PDF files by page, every N pages, or by selecting pages visually. Free, private, runs in our browser.",
  },
];