/* eslint-disable @next/next/no-img-element */
"use client"

import { useEffect, useRef, useState } from "react"
import OptionCards from "@/components/OptionCards"
import { safeFilename } from "@/services/merge"
import {
  imagesToPdf,
  probeImage,
  type MarginSize,
  type Orientation,
  type PageSize,
  type QualityPreset,
  type Rotation,
} from "@/services/image-to-pdf"

const MAX_IMAGES = 100
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|bmp|avif)$/i

const PAGE_SIZES: { value: PageSize; title: string; desc: string }[] = [
  { value: "a4", title: "A4", desc: "210 × 297 mm" },
  { value: "letter", title: "US Letter", desc: "8.5 × 11 in" },
  { value: "fit", title: "Fit to image", desc: "Page matches each image" },
]

const ORIENTATIONS: { value: Orientation; title: string; desc: string }[] = [
  { value: "auto", title: "Auto", desc: "Match each image" },
  { value: "portrait", title: "Portrait", desc: "Always upright pages" },
  { value: "landscape", title: "Landscape", desc: "Always wide pages" },
]

const MARGINS: { value: MarginSize; title: string; desc: string }[] = [
  { value: "none", title: "No margin", desc: "Image fills the page" },
  { value: "small", title: "Small", desc: "0.25 in" },
  { value: "medium", title: "Medium", desc: "0.5 in" },
]

const QUALITIES: { value: QualityPreset; title: string; desc: string }[] = [
  { value: "high", title: "High", desc: "Full size, largest file" },
  { value: "balanced", title: "Balanced", desc: "Good for sharing" },
  { value: "small", title: "Small", desc: "Smallest file" },
]

type Item = {
  id: string
  file: File
  url: string
  rotation: Rotation
  status: "loading" | "ready" | "error"
  width?: number
  height?: number
}

const fmt = (n: number) =>
  n > 1_048_576 ? `${(n / 1_048_576).toFixed(2)} MB` : `${(n / 1024).toFixed(0)} KB`

const isImage = (f: File) =>
  (f.type.startsWith("image/") && !f.type.includes("svg")) || IMAGE_EXT.test(f.name)

export default function ImageToPdf() {
  const [items, setItems] = useState<Item[]>([])
  const [dragging, setDragging] = useState(false) // files dragged in from the OS
  const [overId, setOverId] = useState<string | null>(null) // reorder drop target

  const [pageSize, setPageSize] = useState<PageSize>("a4")
  const [orientation, setOrientation] = useState<Orientation>("auto")
  const [margin, setMargin] = useState<MarginSize>("small")
  const [quality, setQuality] = useState<QualityPreset>("balanced")
  const [outName, setOutName] = useState("images")

  const [progress, setProgress] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    url: string
    filename: string
    size: number
    pages: number
  } | null>(null)

  const dragId = useRef<string | null>(null) // set only while reordering the list
  const nextId = useRef(0)
  const urlsRef = useRef<Set<string>>(new Set()) // every object URL, so none leak
  const abortRef = useRef<AbortController | null>(null)

  const ready = items.filter((i) => i.status === "ready")
  const failed = items.filter((i) => i.status === "error")
  const anyLoading = items.some((i) => i.status === "loading")
  const totalSize = ready.reduce((sum, i) => sum + i.file.size, 0)

  // Revoke all object URLs and stop any running conversion when leaving the page
  useEffect(() => {
    const urls = urlsRef.current
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u))
      urls.clear()
      // eslint-disable-next-line react-hooks/exhaustive-deps
      abortRef.current?.abort()
    }
  }, [])

  function revoke(url: string) {
    URL.revokeObjectURL(url)
    urlsRef.current.delete(url)
  }

  function clearResult() {
    if (result) revoke(result.url)
    setResult(null)
  }

  function patch(id: string, changes: Partial<Item>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...changes } : i)))
  }

  async function addFiles(list: FileList | File[] | null) {
    if (!list) return
    const incoming = Array.from(list)
    if (incoming.length === 0) return

    const images = incoming.filter(isImage)
    const skipped = incoming.length - images.length
    const room = Math.max(0, MAX_IMAGES - items.length)
    const accepted = images.slice(0, room)

    const notes: string[] = []
    if (skipped > 0) notes.push(`${skipped} non-image file(s) were ignored.`)
    if (images.length > room) notes.push(`Limit is ${MAX_IMAGES} images, so some were not added.`)
    setError(notes.length ? notes.join(" ") : null)

    if (accepted.length === 0) return
    clearResult()

    const added: Item[] = accepted.map((file) => {
      const url = URL.createObjectURL(file)
      urlsRef.current.add(url)
      return { id: String(nextId.current++), file, url, rotation: 0, status: "loading" }
    })
    setItems((prev) => [...prev, ...added])

    // Check each image one at a time so many large photos don't freeze the page
    for (const item of added) {
      try {
        const { width, height } = await probeImage(item.file)
        patch(item.id, { status: "ready", width, height })
      } catch {
        patch(item.id, { status: "error" })
      }
    }
  }

  function removeItem(id: string) {
    clearResult()
    const item = items.find((i) => i.id === id)
    if (item) revoke(item.url)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function clearAll() {
    clearResult()
    items.forEach((i) => revoke(i.url))
    setItems([])
    setError(null)
  }

  function rotate(id: string, delta: 90 | -90) {
    clearResult()
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, rotation: ((i.rotation + delta + 360) % 360) as Rotation } : i
      )
    )
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= items.length) return
    clearResult()
    setItems((prev) => {
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function reorder(fromId: string, toId: string) {
    setItems((prev) => {
      const from = prev.findIndex((i) => i.id === fromId)
      const to = prev.findIndex((i) => i.id === toId)
      if (from < 0 || to < 0 || from === to) return prev
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }

  function sortByName() {
    clearResult()
    setItems((prev) =>
      [...prev].sort((a, b) =>
        a.file.name.localeCompare(b.file.name, undefined, { numeric: true, sensitivity: "base" })
      )
    )
  }

  function reverse() {
    clearResult()
    setItems((prev) => [...prev].reverse())
  }

  async function handleConvert() {
    if (ready.length === 0) return
    setBusy(true)
    setError(null)
    setProgress(0)
    clearResult()

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const filename = safeFilename(outName, "images")
      const { blob, pages } = await imagesToPdf(
        ready.map((i) => ({ file: i.file, rotation: i.rotation })),
        {
          pageSize,
          orientation,
          margin,
          quality,
          title: filename.replace(/\.pdf$/i, ""),
          signal: controller.signal,
          onProgress: (done, total) => setProgress(Math.round((done / total) * 100)),
        }
      )
      const url = URL.createObjectURL(blob)
      urlsRef.current.add(url)
      setResult({ url, filename, size: blob.size, pages })
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setError("Conversion cancelled.")
      } else {
        setError(e instanceof Error ? e.message : "Something went wrong")
      }
    } finally {
      setBusy(false)
      abortRef.current = null
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      {/* Upload */}
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          addFiles(e.target.files)
          e.target.value = "" // lets the user re-add the same file
        }}
      />

      <label
        htmlFor="image-upload"
        onDragOver={(e) => {
          if (dragId.current) return // an item is being reordered, not a file being uploaded
          if (!Array.from(e.dataTransfer.types).includes("Files")) return
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          if (dragId.current) return
          e.preventDefault()
          setDragging(false)
          addFiles(e.dataTransfer.files)
        }}
        className={`flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition ${
          dragging ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary/60"
        }`}
      >
        <span className="rounded-xl bg-primary px-8 py-4 text-xl font-bold text-primary-foreground">
          {items.length > 0 ? "Add more images" : "Choose images"}
        </span>
        <span className="text-sm text-muted-foreground">
          or drop JPG, PNG, WebP, GIF or BMP files here
        </span>
      </label>

      {/* Image list */}
      {items.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-auto text-sm font-semibold text-foreground">
              {items.length} {items.length === 1 ? "image" : "images"}
              {ready.length > 0 && (
                <span className="font-normal text-muted-foreground"> · {fmt(totalSize)}</span>
              )}
            </span>
            {[
              { label: "Sort A–Z", onClick: sortByName, disabled: items.length < 2 },
              { label: "Reverse", onClick: reverse, disabled: items.length < 2 },
              { label: "Clear all", onClick: clearAll, disabled: false },
            ].map((b) => (
              <button
                key={b.label}
                onClick={b.onClick}
                disabled={busy || b.disabled}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground transition hover:bg-secondary disabled:opacity-50"
              >
                {b.label}
              </button>
            ))}
          </div>

          <ul className="space-y-2">
            {items.map((item, i) => (
              <li
                key={item.id}
                draggable={!busy}
                onDragStart={(e) => {
                  dragId.current = item.id
                  e.dataTransfer.effectAllowed = "move"
                  e.dataTransfer.setData("text/plain", item.id) // Firefox needs this
                }}
                onDragOver={(e) => {
                  if (!dragId.current) return
                  e.preventDefault()
                  setOverId(item.id)
                }}
                onDrop={(e) => {
                  if (!dragId.current) return
                  e.preventDefault()
                  reorder(dragId.current, item.id)
                  clearResult()
                  dragId.current = null
                  setOverId(null)
                }}
                onDragEnd={() => {
                  dragId.current = null
                  setOverId(null)
                }}
                className={`flex items-center gap-3 rounded-xl border bg-card p-3 transition ${
                  overId === item.id && dragId.current !== item.id
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border"
                } ${busy ? "" : "cursor-grab active:cursor-grabbing"}`}
              >
                <span aria-hidden className="select-none text-muted-foreground">⋮⋮</span>
                <span className="w-6 text-center text-sm font-semibold text-muted-foreground">
                  {i + 1}
                </span>

                <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded border border-border bg-secondary">
                  {item.status !== "error" ? (
                    <img
                      src={item.url}
                      alt=""
                      draggable={false}
                      style={{ transform: `rotate(${item.rotation}deg)` }}
                      className="max-h-16 max-w-16 object-contain transition-transform"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">?</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{item.file.name}</p>
                  {item.status === "error" ? (
                    <p className="text-sm text-red-600">
                      Can&apos;t read this image. Formats like HEIC aren&apos;t supported by most
                      browsers, so convert it to JPG or PNG first. It will be skipped.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {fmt(item.file.size)}
                      {item.width && item.height ? ` · ${item.width}×${item.height}` : ""}
                      {item.rotation !== 0 ? ` · rotated ${item.rotation}°` : ""}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => rotate(item.id, -90)}
                    disabled={busy || item.status !== "ready"}
                    aria-label={`Rotate ${item.file.name} left`}
                    className="rounded-lg px-2.5 py-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-30"
                  >
                    ↺
                  </button>
                  <button
                    onClick={() => rotate(item.id, 90)}
                    disabled={busy || item.status !== "ready"}
                    aria-label={`Rotate ${item.file.name} right`}
                    className="rounded-lg px-2.5 py-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-30"
                  >
                    ↻
                  </button>
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0 || busy}
                    aria-label={`Move ${item.file.name} up`}
                    className="rounded-lg px-2.5 py-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1 || busy}
                    aria-label={`Move ${item.file.name} down`}
                    className="rounded-lg px-2.5 py-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={busy}
                    aria-label={`Remove ${item.file.name}`}
                    className="rounded-lg px-2.5 py-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <p className="text-sm text-muted-foreground">
            Drag images to reorder, or use the arrows. Each image becomes one page, in this order.
          </p>
        </div>
      )}

      {/* Settings */}
      {items.length > 0 && (
        <div className="space-y-6">
          <OptionCards
            legend="Page size"
            name="pdf-page-size"
            options={PAGE_SIZES}
            value={pageSize}
            onChange={(v) => { clearResult(); setPageSize(v) }}
            disabled={busy}
          />

          <OptionCards
            legend="Orientation"
            name="pdf-orientation"
            options={ORIENTATIONS}
            value={orientation}
            onChange={(v) => { clearResult(); setOrientation(v) }}
            disabled={busy || pageSize === "fit"}
            hint={pageSize === "fit" ? "Not needed: each page already matches its image." : undefined}
          />

          <OptionCards
            legend="Margin"
            name="pdf-margin"
            options={MARGINS}
            value={margin}
            onChange={(v) => { clearResult(); setMargin(v) }}
            disabled={busy}
          />

          <OptionCards
            legend="Image quality"
            name="pdf-quality"
            options={QUALITIES}
            value={quality}
            onChange={(v) => { clearResult(); setQuality(v) }}
            disabled={busy}
            hint="Large photos are scaled down on Balanced and Small to keep the PDF light."
          />

          <div className="space-y-2">
            <label htmlFor="pdf-out-name" className="block text-sm font-semibold text-foreground">
              Output file name
            </label>
            <div className="flex items-center gap-2">
              <input
                id="pdf-out-name"
                type="text"
                value={outName}
                onChange={(e) => setOutName(e.target.value)}
                disabled={busy}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
              />
              <span className="text-muted-foreground">.pdf</span>
            </div>
          </div>

          {/* Action */}
          <div className="space-y-2">
            <div className="flex gap-3">
              <button
                onClick={handleConvert}
                disabled={ready.length === 0 || busy || anyLoading}
                className="w-full rounded-xl bg-primary px-6 py-4 text-lg font-bold text-primary-foreground shadow-sm transition
                           hover:bg-primary-hover active:scale-[0.99]
                           focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30
                           disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy
                  ? `Creating PDF… ${progress}%`
                  : anyLoading
                    ? "Reading images…"
                    : `Create PDF from ${ready.length} ${ready.length === 1 ? "image" : "images"}`}
              </button>

              {busy && (
                <button
                  onClick={() => abortRef.current?.abort()}
                  className="rounded-xl border border-border bg-card px-6 py-4 font-semibold text-foreground transition hover:bg-secondary"
                >
                  Cancel
                </button>
              )}
            </div>

            {busy && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {!busy && failed.length > 0 && (
              <p className="text-center text-sm text-red-600">
                {failed.length} unreadable {failed.length === 1 ? "image" : "images"} will be left
                out of the PDF.
              </p>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-red-600">{error}</p>}

      {result && (
        <div className="space-y-4 rounded-xl border border-border bg-card p-5 text-center">
          <p className="text-foreground">
            Created a PDF with <span className="font-bold">{result.pages}</span>{" "}
            {result.pages === 1 ? "page" : "pages"}{" "}
            <span className="text-muted-foreground">({fmt(result.size)})</span>
          </p>
          <a
            href={result.url}
            download={result.filename}
            className="inline-block rounded-xl bg-accent px-6 py-3 font-bold text-accent-foreground transition hover:brightness-95"
          >
            Download PDF
          </a>
        </div>
      )}
    </div>
  )
}