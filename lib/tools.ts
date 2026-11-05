import { Combine, Minimize2, Scissors, type LucideIcon } from "lucide-react";

export type Tool = {
  slug: string;
  title: string;
  desc: string;
  icon: LucideIcon;
};

export const TOOLS: Tool[] = [
  {
    slug: "compress-pdf",
    title: "Compress PDF",
    desc: "Reduce the file size of scanned or image-heavy PDFs.",
    icon: Minimize2,
  },
  {
    slug: "merge-pdf",
    title: "Merge PDF",
    desc: "Combine several PDFs into one, in the order you want.",
    icon: Combine,
  },
  {
    slug: "split-pdf",
    title: "Split PDF",
    desc: "Extract pages or cut a PDF into separate files.",
    icon: Scissors,
  },
];