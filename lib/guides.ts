export type GuideSection = {
  heading: string;
  paragraphs?: string[];
  list?: string[];
  ordered?: boolean;
};

export type Guide = {
  slug: string;
  title: string;
  description: string;
  tool: string; // slug of the tool this guide leads to
  updated: string; // YYYY-MM-DD
  sections: GuideSection[];
};

export const GUIDES: Guide[] = [
  {
    slug: "compress-pdf-to-under-200kb",
    title: "How to Compress a PDF to Under 200 KB",
    description:
      "Practical ways to shrink a PDF for strict upload limits: choosing the right compression level, removing pages, and knowing when a PDF can’t get any smaller.",
    tool: "compress-pdf",
    updated: "2026-11-11",
    sections: [
      {
        heading: "Why some PDFs shrink easily and others don’t",
        paragraphs: [
          "Many job portals, school systems and government forms limit uploads to a few hundred kilobytes. Whether you can reach 200 KB depends almost entirely on what is inside the file.",
          "A PDF made of typed text is usually small already. A scan or a set of phone photos is different: each page is a large image, and a short document can easily reach several megabytes. That second kind is where compression helps most. Compress PDF can’t aim for an exact size, but it reduces image-heavy files a lot and shows you the result, so you can decide what to do next.",
        ],
      },
      {
        heading: "Step by step",
        ordered: true,
        list: [
          "Open Compress PDF and add your file. Note the size shown on the file card.",
          "Choose Balanced and press Compress PDF. Check the before and after sizes.",
          "If it is still too large, go back to your original file and try Strong. Compress the original again rather than the already-compressed copy, because repeating the process only lowers quality.",
          "Open the result and zoom in to check that small print, stamps and signatures are still readable before you upload it.",
        ],
      },
      {
        heading: "If it is still too large",
        list: [
          "Delete pages you don’t need with Reorder PDF, then compress the shorter file.",
          "Split the document into two files with Split PDF, if the form accepts more than one upload.",
          "If your pages started as photos, build the PDF again with JPG to PDF and choose the Small quality setting, which scales large photos down before placing them in the document.",
          "When scanning, use a lower resolution such as 150 DPI, or a black-and-white mode for plain text pages.",
        ],
      },
      {
        heading: "When a PDF can’t get smaller",
        paragraphs: [
          "If your PDF is mostly typed text, for example an export from Word, rebuilding it as images usually makes it bigger, not smaller. In that case Compress PDF keeps your original file, so the size doesn’t change.",
          "For those files, the better route is to re-export from the program that created them. Many programs, including Word, offer a smaller-size option when saving as PDF, and removing large embedded images at the source has more effect than any after-the-fact tool.",
        ],
      },
      {
        heading: "Keep your original",
        paragraphs: [
          "Always keep the original file. A compressed copy can’t be turned back into the original quality, so use the small version only for the upload that needs it.",
        ],
      },
    ],
  },
  {
    slug: "merge-pdf-files-in-order",
    title: "How to Merge PDF Files in the Right Order",
    description:
      "A short checklist for combining several PDFs into one document without scrambled pages, on a computer or a phone.",
    tool: "merge-pdf",
    updated: "2026-11-11",
    sections: [
      {
        heading: "Prepare your files",
        paragraphs: [
          "Most merging mistakes are decided before you start. A few minutes of preparation saves you from redoing the whole job.",
        ],
        list: [
          "Number your files in the order you want them, such as 01-cover.pdf, 02-form.pdf and 03-receipt.pdf.",
          "Fix sideways pages first with Reorder PDF. A page that is rotated in one file stays rotated in the merged file.",
          "Make sure none of the files is password-protected, because the tool can’t open those.",
          "Leave out files you don’t need, so the merged document holds only what the recipient should see.",
        ],
      },
      {
        heading: "Merge step by step",
        ordered: true,
        list: [
          "Open Merge PDF and choose all your files at once, or add them in batches.",
          "Click Sort A–Z if your files are numbered, or drag them into order. On a phone, use the arrow buttons.",
          "Give the merged file a clear name, for example your name and the type of document.",
          "Press Merge, then download the result.",
        ],
      },
      {
        heading: "Check the result",
        paragraphs: [
          "The summary shows the total page count. Add up the pages of your original files and make sure the numbers match. Then scroll through the merged PDF once, looking at the first page of each original document to confirm the order.",
        ],
      },
      {
        heading: "Common problems",
        list: [
          "A file is marked as unreadable: it is probably password-protected or damaged. Remove the password in the program that created it, or export a fresh copy, then add it again.",
          "The order is wrong: merge again from your original files, which are never changed by the tool.",
          "The merged file is very large: merging doesn’t reduce quality, so the result is about the sum of the originals. Run it through Compress PDF if it is image-heavy.",
          "Dragging doesn’t work on a phone: use the up and down arrows on each file.",
        ],
      },
    ],
  },
  {
    slug: "scanned-pdf-to-text-ocr",
    title: "How to Turn a Scanned PDF into Text with OCR",
    description:
      "Why you can’t copy text from a scanned PDF, and how to extract it with OCR in your browser, including tips for more accurate results.",
    tool: "pdf-to-text",
    updated: "2026-11-11",
    sections: [
      {
        heading: "Why you can’t copy text from a scan",
        paragraphs: [
          "A scanned PDF is a stack of pictures. Your eyes see words, but the file contains no text, only pixels, so selecting or searching does nothing. Optical character recognition (OCR) looks at those pixels and works out which letters they form.",
          "PDF to Text does this in your browser. In Auto mode it reads the text directly from pages that have a text layer and applies OCR only to pages that are images, so mixed documents work without extra steps.",
        ],
      },
      {
        heading: "Step by step",
        ordered: true,
        list: [
          "Open PDF to Text and add your file.",
          "Leave the mode on Auto. Choose OCR all pages only if the text from a normal PDF comes out garbled.",
          "Choose the language of the document: English, Indonesian, or both for mixed text.",
          "If the document is long, type a page range so you stay within the limit of 30 OCR pages per run.",
          "Press Extract text, then copy the result or download it as a .txt file.",
        ],
      },
      {
        heading: "Getting more accurate results",
        list: [
          "Choose the right language. This matters more than anything else.",
          "Scan flat, straight and evenly lit. Skewed pages, shadows and creases cause mistakes.",
          "Dark text on a light background works best. Coloured or patterned backgrounds are harder to read.",
          "Scans of roughly 200 to 300 DPI usually give the best balance of accuracy and speed, and much lower resolutions blur small letters.",
        ],
      },
      {
        heading: "What to expect",
        paragraphs: [
          "OCR is good, not perfect. Expect occasional wrong letters, especially in small print, and check numbers, names and dates against the original. Handwriting isn’t supported, and tables or multi-column layouts may come out in a different order than you read them.",
        ],
      },
      {
        heading: "Long documents",
        paragraphs: [
          "OCR takes a few seconds per page, so one run is limited to 30 pages that need it. For a long scan, run it in batches using the page range, such as 1-30 and then 31-60, and paste the text files together. Split PDF can also cut the scan into separate files first.",
        ],
      },
    ],
  },
];