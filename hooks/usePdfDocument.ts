"use client"

import { useEffect, useRef, useState } from "react"
import { loadPdfThumbnails } from "@/services/thumbnails"

type Options = {
  /** How many page thumbnails to render. Use 1 when only a preview of page 1 is needed. */
  limit?: number
  /** Called when the PDF can't be read (password-protected or damaged) */
  onError?: (message: string) => void
}

type Loaded = {
  file: File
  totalPages: number
  thumbs: (string | undefined)[]
}

export function usePdfDocument(file: File | null, { limit, onError }: Options = {}) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  // Keeps the latest callback without re-running the loader when its identity changes
  const onErrorRef = useRef(onError)
  useEffect(() => {
    onErrorRef.current = onError
  })

  useEffect(() => {
    if (!file) return

    const controller = new AbortController()
    const alive = () => !controller.signal.aborted

    loadPdfThumbnails(file, {
      limit,
      signal: controller.signal,
      onMeta: (totalPages) => {
        if (alive()) setLoaded({ file, totalPages, thumbs: [] })
      },
      onThumb: (index, url) => {
        if (!alive()) return
        setLoaded((prev) => {
          if (!prev || prev.file !== file) return prev
          const thumbs = prev.thumbs.slice()
          thumbs[index] = url
          return { ...prev, thumbs }
        })
      },
    }).catch(() => {
      if (!alive()) return
      onErrorRef.current?.("Could not read this PDF. It may be password-protected or damaged.")
    })

    return () => controller.abort()
  }, [file, limit])

  // Results belong to the file they were loaded for, so picking a new file
  // never briefly shows the previous file's pages
  const current = loaded && loaded.file === file ? loaded : null

  return {
    totalPages: current?.totalPages ?? 0,
    thumbs: current?.thumbs ?? [],
  }
}