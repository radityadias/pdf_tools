"use client"

import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist"
import { useEffect, useRef, useState, type ReactNode } from "react"

const MAX_PIXELS = 16_000_000

export default function PageStage({
  pdf,
  pageIndex,
  onBackgroundPointerDown,
  children,
}: {
  pdf: PDFDocumentProxy
  pageIndex: number
  onBackgroundPointerDown?: () => void
  children?: ReactNode
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const taskRef = useRef<RenderTask | null>(null)
  const [width, setWidth] = useState(0)
  const [aspect, setAspect] = useState(0.75) // displayed width / height
  const [rendering, setRendering] = useState(true)

  // Follow the width of the container
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Stop any running render when leaving the page
  useEffect(() => () => taskRef.current?.cancel(), [])

  useEffect(() => {
    if (!width) return
    let cancelled = false
    setRendering(true)

    ;(async () => {
      // pdf.js can't run two renders on one canvas, so wait for the previous one to stop
      const previous = taskRef.current
      if (previous) {
        previous.cancel()
        try {
          await previous.promise
        } catch {
          // cancelled
        }
      }
      if (cancelled) return

      const page = await pdf.getPage(pageIndex + 1)
      if (cancelled) return

      const unit = page.getViewport({ scale: 1 })
      setAspect(unit.width / unit.height)

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const scale = Math.min(
        (width * dpr) / unit.width,
        Math.sqrt(MAX_PIXELS / (unit.width * unit.height))
      )
      const viewport = page.getViewport({ scale })

      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)

      const task = page.render({ canvas, canvasContext: canvas.getContext("2d")!, viewport })
      taskRef.current = task
      try {
        await task.promise
        if (!cancelled) setRendering(false)
      } catch {
        // cancelled by a newer render
      }
    })()

    return () => {
      cancelled = true
    }
  }, [pdf, pageIndex, width])

  return (
    <div
      ref={boxRef}
      className="relative mx-auto w-full max-w-3xl rounded-lg border border-border bg-white shadow-sm"
      style={{ aspectRatio: aspect }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full rounded-lg" />
      {rendering && (
        <div aria-hidden className="pointer-events-none absolute inset-0 animate-pulse rounded-lg bg-secondary/40" />
      )}
      <div data-stage className="absolute inset-0" onPointerDown={onBackgroundPointerDown}>
        {children}
      </div>
    </div>
  )
}