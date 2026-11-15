"use client"

import type { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist"
import { useEffect, useRef, useState } from "react"

export function usePdfDoc(
  file: File | null,
  onError?: (message: string) => void
): PDFDocumentProxy | null {
  const [loaded, setLoaded] = useState<{ file: File; pdf: PDFDocumentProxy } | null>(null)

  // Keeps the latest callback without reloading the PDF when its identity changes
  const onErrorRef = useRef(onError)
  useEffect(() => {
    onErrorRef.current = onError
  })

  useEffect(() => {
    if (!file) return

    let cancelled = false
    let task: PDFDocumentLoadingTask | null = null

    ;(async () => {
      try {
        const pdfjs = await import("pdfjs-dist")
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"
        task = pdfjs.getDocument({ data: await file.arrayBuffer() })
        const pdf = await task.promise
        if (cancelled) {
          await task.destroy()
          return
        }
        setLoaded({ file, pdf })
      } catch {
        if (!cancelled) {
          onErrorRef.current?.("Could not read this PDF. It may be password-protected or damaged.")
        }
      }
    })()

    return () => {
      cancelled = true
      void task?.destroy()
    }
  }, [file])

  // The result belongs to its file, so a new file never briefly shows the old document
  return loaded && loaded.file === file ? loaded.pdf : null
}