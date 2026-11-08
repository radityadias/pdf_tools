export const MAX_THUMBS = 150;

type Options = {
  maxWidth?: number;
  /** How many pages to render (capped at MAX_THUMBS). Default: MAX_THUMBS */
  limit?: number;
  signal?: AbortSignal;
  onMeta: (totalPages: number) => void;
  onThumb: (index: number, dataUrl: string) => void;
};

export async function loadPdfThumbnails(file: File, opts: Options): Promise<void> {
  const { maxWidth = 140, limit = MAX_THUMBS, signal, onMeta, onThumb } = opts;

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() });

  try {
    const pdf = await loadingTask.promise;
    if (signal?.aborted) return;
    onMeta(pdf.numPages);

    const count = Math.min(pdf.numPages, limit, MAX_THUMBS);
    for (let i = 1; i <= count; i++) {
      if (signal?.aborted) return;

      const page = await pdf.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: maxWidth / base.width });

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvas,
        canvasContext: canvas.getContext("2d")!,
        viewport,
      }).promise;

      onThumb(i - 1, canvas.toDataURL("image/jpeg", 0.7));

      canvas.width = canvas.height = 0;
      page.cleanup();
    }
  } finally {
    await loadingTask.destroy();
  }
}