export async function renderFirstPage(
  file: File,
  maxWidth = 200
): Promise<{ thumb: string; pages: number }> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() });

  try {
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

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

    const result = { thumb: canvas.toDataURL("image/jpeg", 0.8), pages: pdf.numPages };

    canvas.width = canvas.height = 0;
    page.cleanup();
    return result;
  } finally {
    await loadingTask.destroy();
  }
}