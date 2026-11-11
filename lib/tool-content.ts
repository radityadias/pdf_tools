export type ToolContent = {
  intro: string[];
  steps: { title: string; text: string }[];
  tips: string[];
  limits: string[];
  faqs: { q: string; a: string }[];
  related: string[]; // tool slugs
};

export const TOOL_CONTENT: Record<string, ToolContent> = {
  "compress-pdf": {
    intro: [
      "Large PDFs are a daily annoyance: an email attachment that bounces, an application form that rejects anything over a few megabytes, a scan that takes forever to open on a phone. This tool makes a smaller copy of your PDF right in your browser, so you can fit those limits without installing software or creating an account.",
      "It works by re-drawing each page as a compressed image and rebuilding the PDF from those images. That makes it very effective on scanned documents, photo-heavy files and presentations with large pictures. Your original file is never changed, and nothing is uploaded: the whole process runs on your own device.",
    ],
    steps: [
      { title: "Choose your PDF", text: "Click Choose PDF or drop the file onto the page. A preview of the first page and the page count confirm that it loaded correctly." },
      { title: "Pick a compression level", text: "Light keeps pages sharp, Balanced suits most documents, and Strong gives the smallest file at lower quality. If you’re unsure, start with Balanced." },
      { title: "Compress", text: "Press Compress PDF and watch the progress bar. Larger files take longer, because every page is processed on your device." },
      { title: "Check and download", text: "The result shows the size before and after. Open the downloaded file and check that the text is still readable before you send it." },
    ],
    tips: [
      "Start with Balanced. If the file is still too big, compress the original again on Strong instead of compressing the already-compressed copy, since repeating compression lowers quality faster than it saves space.",
      "Scanned pages and photos shrink the most. If most of your pages are scans, expect a large reduction.",
      "Need to fit a strict limit? Delete the pages you don’t need with Reorder PDF before compressing.",
      "Always keep the original file until you have checked the compressed one.",
    ],
    limits: [
      "Compressing turns pages into images, so text in the smaller file can no longer be selected or searched. Use PDF to Text first if you need the text.",
      "PDFs that are mostly typed text, such as exports from Word, are already compact and often can’t be reduced. If the new file would be larger, the tool keeps your original instead.",
      "Password-protected PDFs can’t be opened.",
      "Very large files, with hundreds of pages or hundreds of megabytes, can be slow or exceed what your browser can handle.",
    ],
    faqs: [
      { q: "Is my PDF uploaded to a server?", a: "No. The compression runs in your browser using JavaScript, so your document never leaves your device." },
      { q: "How much smaller will my PDF get?", a: "It depends on the content. Scanned and image-heavy PDFs often shrink dramatically, while text-only PDFs may not shrink at all. The tool shows the exact size before and after, so you can see the difference for yourself." },
      { q: "Why can’t I select text in the compressed PDF?", a: "Each page is rebuilt as an image to make the file smaller, and images contain no selectable text. If you need the text, extract it from the original with PDF to Text." },
      { q: "Which level should I choose?", a: "Use Light for documents with small print that you will read on screen, Balanced for most files, and Strong when the file size matters more than sharpness, such as ID scans for an online form." },
      { q: "Can I compress several PDFs at once?", a: "Not at the moment. Compress files one at a time, or combine them first with Merge PDF." },
    ],
    related: ["reorder-pdf", "split-pdf", "merge-pdf"],
  },

  "merge-pdf": {
    intro: [
      "Contracts, receipts, scanned pages and application documents often arrive as separate PDFs, but whoever receives them wants a single file. Merge PDF combines up to 50 files into one document, in the order you choose, without uploading anything.",
      "Everything happens in your browser. Pages are copied as they are, not re-drawn, so text stays selectable, images keep their quality and the merged file is roughly the sum of the originals. You can preview the first page of each file, drag files into order, and name the result before you download it.",
    ],
    steps: [
      { title: "Add your PDFs", text: "Choose several files at once or add them in batches. You can also drop them onto the page." },
      { title: "Put them in order", text: "Drag files up or down, or use the arrow buttons on a phone. Sort A–Z orders files by name, which is handy for numbered scans like scan-01 and scan-02." },
      { title: "Name the file", text: "Type a name for the merged PDF. The .pdf ending is added for you." },
      { title: "Merge and download", text: "Press Merge, then download the result. The summary shows how many pages it contains, so you can check that nothing is missing." },
    ],
    tips: [
      "Number your files (01, 02, 03) before you start, then use Sort A–Z to put them in the right order in one click.",
      "Check the page total in the summary. It should equal the sum of the pages of the files you added.",
      "If a document has a sideways page, fix it first with Reorder PDF, then merge.",
      "Remove files you don’t need with the ✕ button before merging, so the result holds only what the recipient should see.",
    ],
    limits: [
      "Password-protected or damaged PDFs can’t be read. They are marked in the list and left out of the merge.",
      "You can merge up to 50 files at a time.",
      "Bookmarks and form fields from the original files aren’t carried over. The pages themselves are unchanged.",
      "Very large combined sizes can be slow or fail on phones and older computers.",
    ],
    faqs: [
      { q: "Does merging reduce quality?", a: "No. Pages are copied directly rather than converted to images, so text stays sharp and selectable." },
      { q: "Can I merge Word documents or images?", a: "This tool takes PDFs only. To turn photos or scans into a PDF first, use JPG to PDF, then merge the results." },
      { q: "Why was one of my files skipped?", a: "A file is skipped when it can’t be opened, usually because it is password-protected or damaged. Remove the password in the program that created it, then add it again." },
      { q: "Is there a file size limit?", a: "There is no fixed size limit, but files are processed in your device’s memory, so hundreds of megabytes together may be too much for a phone." },
      { q: "Will the pages inside each file change order?", a: "No. Each file’s pages stay in their original order, and the files appear in the order shown in the list." },
    ],
    related: ["jpg-to-pdf", "reorder-pdf", "compress-pdf"],
  },

  "split-pdf": {
    intro: [
      "Sometimes you only need part of a PDF: one invoice from a long statement, a chapter from a scanned book, or a few pages to send to a colleague. Split PDF cuts a document into the pages you want, in your browser, with nothing uploaded.",
      "There are three ways to split. Type page ranges such as 1-3, 5, 8-, cut the document into equal parts every N pages, or click page thumbnails to select pages visually. The results come out as separate PDFs or as one combined PDF, and several files are bundled into a ZIP.",
    ],
    steps: [
      { title: "Choose your PDF", text: "Add the file and check the page count shown under its name." },
      { title: "Pick a split mode", text: "Use By range for specific pages, Every N pages for equal parts, or Select pages to click the thumbnails you want." },
      { title: "Check the summary", text: "Before you split, the tool tells you how many PDFs it will create, so you can catch a typo in the range." },
      { title: "Split and download", text: "A single result downloads as a PDF. Several results arrive together in a ZIP file." },
    ],
    tips: [
      "In range mode, 8- means page 8 to the end of the document.",
      "Tick the combine option to merge all your ranges into one PDF, a quick way to pull scattered pages together. Pages follow the order you type them.",
      "Use Select pages for documents you can recognise by sight, such as forms or scanned letters.",
      "Every N pages is ideal for cutting a long scan into one file per document, when every document has the same length.",
    ],
    limits: [
      "Thumbnails are generated for the first 150 pages. Later pages appear as numbered tiles, and you can still select them or use range mode.",
      "Split files can be larger than you expect, because each output keeps its own copy of shared fonts and images.",
      "Password-protected PDFs can’t be opened.",
      "Bookmarks and form fields aren’t carried into the new files.",
    ],
    faqs: [
      { q: "Does splitting change the pages?", a: "No. Pages are copied as they are, so text and images are unchanged." },
      { q: "How do I extract just one page?", a: "Choose By range and type the page number, for example 7. You get a one-page PDF." },
      { q: "What is in the ZIP file?", a: "One PDF per range or part, named after your original file with the page numbers, such as report_1_pages-1-3.pdf." },
      { q: "Can I split by bookmarks or by file size?", a: "Not yet. You can split by page range, by every N pages, or by selecting pages." },
      { q: "Is it safe for confidential documents?", a: "The splitting happens on your device and the file is never uploaded, so your document stays with you." },
    ],
    related: ["merge-pdf", "reorder-pdf", "pdf-to-jpg"],
  },

  "pdf-to-jpg": {
    intro: [
      "Need a page from a PDF as a picture? Maybe to post a slide, attach a scan to a form that only accepts images, or paste a page into a chat. PDF to Image turns pages into JPG, PNG or WebP images, entirely in your browser.",
      "You choose which pages to convert, the image format and the resolution. Pages appear in a gallery as they finish, so you can download them one by one or all together as a ZIP file.",
    ],
    steps: [
      { title: "Choose your PDF", text: "Add the file and check the page count shown under its name." },
      { title: "Select the pages", text: "Convert all pages, type a range such as 1-3, 5, or click thumbnails to pick pages." },
      { title: "Choose format and resolution", text: "JPG makes small files, PNG keeps text perfectly sharp, and WebP is smaller still in modern browsers. Use 72 DPI for screens, 150 DPI for most uses and 300 DPI for printing." },
      { title: "Convert and download", text: "Press Convert to images. Download a single image directly, or all pages together as a ZIP." },
    ],
    tips: [
      "For sharing online, JPG at 150 DPI is a good balance between size and sharpness.",
      "Choose PNG for pages with small text, line drawings or screenshots, where JPG can look slightly fuzzy.",
      "For printing, use 300 DPI, but expect large files.",
      "Convert only the pages you need. A range is much faster than converting a long document.",
    ],
    limits: [
      "Up to 100 pages can be converted in one run. Use a page range for longer documents.",
      "Very large pages, such as posters, are scaled down automatically to stay within browser limits, and the tool tells you when that happens.",
      "In some older versions of Safari, WebP output can fall back to PNG.",
      "The images contain no selectable text. Use PDF to Text if you need the words.",
      "Password-protected PDFs can’t be opened.",
    ],
    faqs: [
      { q: "Which format should I choose?", a: "JPG for photos and general sharing, PNG for sharp text and graphics, and WebP when you want the smallest file and your viewers use a modern browser." },
      { q: "What does DPI mean?", a: "DPI is the number of pixels used per inch of page. Higher DPI makes sharper, larger images: 150 suits screens, and 300 suits printing." },
      { q: "Why are my PNG files so big?", a: "PNG is lossless, so detailed pages can take several megabytes each at 300 DPI. Use JPG or a lower DPI for smaller files." },
      { q: "Do transparent areas stay transparent?", a: "No. Pages are drawn on a white background, as they would look on paper." },
      { q: "Are my pages uploaded anywhere?", a: "No. The conversion happens in your browser, and the images are created on your device." },
    ],
    related: ["jpg-to-pdf", "pdf-to-text", "split-pdf"],
  },

  "jpg-to-pdf": {
    intro: [
      "Photos of documents, screenshots, receipts and scans are easier to share as a single PDF. JPG to PDF turns images into one PDF, one image per page, in your browser, with no upload and no signup.",
      "You control the page order, rotation, page size, margins and quality. It handles JPG, PNG and WebP images, and most other formats your browser can open. It also corrects the orientation of phone photos automatically and lets you name the finished PDF.",
    ],
    steps: [
      { title: "Add your images", text: "Choose several images at once or drop them onto the page. You can add more at any time." },
      { title: "Arrange them", text: "Drag images into order, rotate any that are sideways with the rotate buttons, and remove the ones you don’t need." },
      { title: "Choose the page settings", text: "Pick A4, US Letter or Fit to image, then the orientation, margin and quality that suit your document." },
      { title: "Create and download", text: "Press Create PDF and download the result. The summary shows the page count and file size." },
    ],
    tips: [
      "Number or name your photos in the order you took them, then use Sort A–Z to line them up in one click.",
      "Use A4 or Letter for documents you will print or submit. Use Fit to image for screenshots and photos, where white bars would look odd.",
      "Choose High quality for screenshots and text, and Balanced for photos you plan to email.",
      "Rotate sideways photos before creating the PDF. The thumbnail shows the rotation you chose.",
    ],
    limits: [
      "You can add up to 100 images per PDF.",
      "iPhone HEIC photos aren’t supported by most browsers. Set the camera to Most Compatible, share them as JPG, or convert them before adding.",
      "Balanced and Small convert images to JPEG and shrink large photos, which can soften fine text. Use High for text.",
      "Transparent PNGs get a white background on the Balanced and Small settings.",
      "Text inside photos isn’t recognised. Create the PDF here, then use PDF to Text to extract it.",
    ],
    faqs: [
      { q: "Can I combine many photos into one PDF?", a: "Yes. Add as many as you like, up to 100, arrange them in order, and each becomes one page." },
      { q: "Will my images lose quality?", a: "On High quality, images keep their original resolution, up to about 4096 pixels on the longest side, and PNGs stay lossless. Balanced and Small trade some sharpness for a smaller file." },
      { q: "Why is my PDF so large?", a: "Large photos produce large PDFs. Switch to Balanced or Small, which scale pictures down before placing them in the document." },
      { q: "What does Fit to image do?", a: "Each page takes the shape of its image instead of a standard paper size, so nothing is cropped and there are no empty margins unless you choose one." },
      { q: "Are my photos uploaded?", a: "No. Everything runs in your browser, and the PDF is created on your device." },
    ],
    related: ["merge-pdf", "pdf-to-jpg", "compress-pdf"],
  },

  "pdf-to-text": {
    intro: [
      "Copying text out of a PDF is easy when the text is real and impossible when the PDF is a scan. PDF to Text handles both: it reads the text directly where it exists and uses OCR (optical character recognition) on pages that are only images.",
      "You can copy the result or download it as a .txt file. It works in English and Indonesian, and everything runs in your browser, including the OCR engine, so your documents are never uploaded.",
    ],
    steps: [
      { title: "Choose your PDF", text: "Add the file and check the page count shown under its name." },
      { title: "Pick a mode", text: "Auto is recommended: it reads text directly and uses OCR only on scanned pages. Text only is fastest, and OCR all pages reads every page as an image." },
      { title: "Set the language and pages", text: "Choose the language of the document (English, Indonesian or both). Optionally type a page range such as 1-3, 5." },
      { title: "Extract, then copy or download", text: "Press Extract text. Copy the result or download it as a .txt file, and tick the page separator option if you want page markers." },
    ],
    tips: [
      "Leave Auto on unless you have a reason to change it. It only uses the slower OCR on pages that need it.",
      "Choose the language the document is written in. OCR gets noticeably worse with the wrong language. For mixed documents, choose English + Indonesian.",
      "For scans, flat, straight, evenly lit pages with dark text on a light background give the best results.",
      "Proofread numbers, names and dates in OCR output before relying on them.",
    ],
    limits: [
      "OCR takes a few seconds per page, so one run is limited to 30 pages that need it. Use the page range for longer scans.",
      "Up to 500 pages can be processed in one run for PDFs that already contain text.",
      "Handwriting, very small or blurry text, and complex layouts such as tables or several columns can produce errors or a different reading order.",
      "The first OCR run takes longer while the engine loads.",
      "Password-protected PDFs can’t be opened.",
    ],
    faqs: [
      { q: "What is OCR?", a: "Optical character recognition is software that looks at the pixels of an image of text and works out which letters they form. It is what makes the text of a scanned page copyable." },
      { q: "Why does Text only return nothing for my file?", a: "Your PDF is probably a scan, which has no text layer. Switch to Auto or OCR all pages." },
      { q: "Why is the text in the wrong order?", a: "Pages with several columns, tables or text boxes don’t always store their text in reading order. Proofread those pages, or extract them one at a time." },
      { q: "Which languages are supported?", a: "English, Indonesian, and both together for mixed documents." },
      { q: "How accurate is it?", a: "Clean, typed scans are usually read very well. Accuracy drops with blur, skew, shadows, small print and handwriting, so check anything important against the original." },
    ],
    related: ["pdf-to-jpg", "jpg-to-pdf", "split-pdf"],
  },

  "reorder-pdf": {
    intro: [
      "A PDF in the wrong order, with a sideways page, or with a blank page in the middle doesn’t need to be recreated. Reorder PDF lets you rearrange pages by dragging, rotate them, duplicate them and delete the ones you don’t need, then download a clean new file.",
      "You see every page as a thumbnail, with its new position on top, so you can check the result before creating it. Changes can be undone step by step, nothing is uploaded, and pages are copied as they are, so text stays selectable and quality is unchanged.",
    ],
    steps: [
      { title: "Choose your PDF", text: "Add the file and wait a moment while the page thumbnails appear." },
      { title: "Arrange the pages", text: "Drag a page to a new position, or use the arrow buttons under each page, which also work on phones." },
      { title: "Rotate, duplicate or delete", text: "Use the buttons under each page to rotate it, repeat it, or remove it. Deleted pages fade out and can be restored." },
      { title: "Apply and download", text: "Name the file and press Apply changes and create PDF. The button stays disabled until you make at least one change." },
    ],
    tips: [
      "Use Reverse to fix a document that was scanned back to front.",
      "Duplicate a page to repeat it, for example a signature page or a cover sheet.",
      "Use Undo freely. It remembers your last 50 steps, and Reset all returns the document to how it started.",
      "Rotate all turns every page at once, which is useful when a whole scan came out sideways.",
    ],
    limits: [
      "The editor supports PDFs up to 300 pages, with thumbnails for the first 150. Later pages appear as numbered tiles that you can edit the same way.",
      "Bookmarks, form fields and internal links aren’t kept in the new file.",
      "Password-protected PDFs can’t be opened.",
      "Drag and drop works with a mouse. On phones, use the arrow buttons.",
    ],
    faqs: [
      { q: "Can I rotate just one page?", a: "Yes. Every page has its own rotate buttons, and Rotate all is there for when the whole document needs turning." },
      { q: "Does reordering reduce quality?", a: "No. Pages are copied rather than converted to images, so text stays sharp and selectable." },
      { q: "Can I add pages from another PDF?", a: "Not in this tool. Use Merge PDF to combine documents, then reorder the result." },
      { q: "Are deleted pages really removed?", a: "Yes. Pages you delete are not copied into the new file." },
      { q: "Is my original file changed?", a: "Never. The tool creates a new file, and your original stays exactly as it was." },
    ],
    related: ["merge-pdf", "split-pdf", "compress-pdf"],
  },
};