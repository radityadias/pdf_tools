/* eslint-disable @next/next/no-img-element */
"use client"

import { useRef, useState } from "react"
import { mergePdf, safeFilename } from "@/services/merge"
import { renderFirstPage } from "@/services/preview"

const MAX_FILES = 50

type Item = {
  id: string
  file: File
  status: "loading" | "ready" | "error"
  thumb?: string
  pages?: number
}

const fmt = (n: number) =>
  n > 1_048_576 ? `${(n / 1_048_576).toFixed(2)} MB` : `${(n / 1024).toFixed(0)} KB`

const isPdf = (f: File) => f.type === "application/pdf" || /\.pdf$/i.test(f.name)

export default function PdfMerge() {
  const [items, setItems] = useState<Item[]>([])
  const [outName, setOutName] = useState("merged")
  const [dragging, setDragging] = useState(false) // files dragged in from the OS
  const [overId, setOverId] = useState<string | null>(null) // reorder drop target

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

  const ready = items.filter((i) => i.status === "ready")
  const failed = items.filter((i) => i.status === "error")
  const anyLoading = items.some((i) => i.status === "loading")
  const totalPages = ready.reduce((sum, i) => sum + (i.pages ?? 0), 0)
  const totalSize = ready.reduce((sum, i) => sum + i.file.size, 0)

  function clearResult() {
    if (result) URL.revokeObjectURL(result.url)
    setResult(null)
  }

  function patch(id: string, changes: Partial<Item>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...changes } : i)))
  }

  async function addFiles(list: FileList | File[] | null) {
    if (!list) return
    const incoming = Array.from(list)
    if (incoming.length === 0) return

    const pdfs = incoming.filter(isPdf)
    const skipped = incoming.length - pdfs.length

    const room = Math.max(0, MAX_FILES - items.length)
    const accepted = pdfs.slice(0, room)

    const notes: string[] = []
    if (skipped > 0) notes.push(`${skipped} non-PDF file(s) were ignored.`)
    if (pdfs.length > room) notes.push(`Limit is ${MAX_FILES} files, so some were not added.`)
    setError(notes.length ? notes.join(" ") : null)

    if (accepted.length === 0) return
    clearResult()

    const added: Item[] = accepted.map((file) => ({
      id: String(nextId.current++),
      file,
      status: "loading",
    }))
    setItems((prev) => [...prev, ...added])

    // Thumbnails one at a time so many files don't freeze the page
    for (const item of added) {
      try {
        const { thumb, pages } = await renderFirstPage(item.file, 120)
        patch(item.id, { status: "ready", thumb, pages })
      } catch {
        patch(item.id, { status: "error" })
      }
    }
  }

  function removeItem(id: string) {
    clearResult()
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function clearAll() {
    clearResult()
    setItems([])
    setError(null)
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

  async function handleMerge() {
    if (ready.length < 2) return
    setBusy(true)
    setError(null)
    setProgress(0)
    clearResult()

    try {
      const filename = safeFilename(outName)
      const { blob, pages } = await mergePdf(
        ready.map((i) => i.file),
        {
          title: filename.replace(/\.pdf$/i, ""),
          onProgress: (done, total) => setProgress(Math.round((done / total) * 100)),
        }
      )
      setResult({ url: URL.createObjectURL(blob), filename, size: blob.size, pages })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      {/* Upload */}
      <input
        id="merge-upload"
        type="file"
        accept="application/pdf"
        multiple
        hidden
        onChange={(e) => {
          addFiles(e.target.files)
          e.target.value = "" // lets the user re-add the same file
        }}
      />

      <label
        htmlFor="merge-upload"
        onDragOver={(e) => {
          if (dragId.current) return // an item is being reordered, not a file being uploaded
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
          {items.length > 0 ? "Add more PDFs" : "Choose PDFs"}
        </span>
        <span className="text-sm text-muted-foreground">
          or drop PDF files here (select several at once)
        </span>
      </label>

      {/* File list */}
      {items.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-auto text-sm font-semibold text-foreground">
              {items.length} {items.length === 1 ? "file" : "files"}
              {ready.length > 0 && (
                <span className="font-normal text-muted-foreground">
                  {" "}· {totalPages} pages · {fmt(totalSize)}
                </span>
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

                {item.thumb ? (
                  <img
                    src={item.thumb}
                    alt=""
                    draggable={false}
                    className="h-16 w-auto rounded border border-border shadow-sm"
                  />
                ) : (
                  <div
                    className={`h-16 w-12 shrink-0 rounded bg-secondary ${
                      item.status === "loading" ? "animate-pulse" : ""
                    }`}
                  />
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{item.file.name}</p>
                  {item.status === "error" ? (
                    <p className="text-sm text-red-600">
                      Can&apos;t read this file (password-protected or damaged). It will be skipped.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {fmt(item.file.size)}
                      {item.pages ? ` · ${item.pages} ${item.pages === 1 ? "page" : "pages"}` : ""}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
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
            Drag files to reorder, or use the arrows. The merged PDF follows this order.
          </p>
        </div>
      )}

      {/* Output + action */}
      {items.length > 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="out-name" className="block text-sm font-semibold text-foreground">
              Output file name
            </label>
            <div className="flex items-center gap-2">
              <input
                id="out-name"
                type="text"
                value={outName}
                onChange={(e) => setOutName(e.target.value)}
                disabled={busy}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
              />
              <span className="text-muted-foreground">.pdf</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleMerge}
              disabled={ready.length < 2 || busy || anyLoading}
              className="w-full rounded-xl bg-primary px-6 py-4 text-lg font-bold text-primary-foreground shadow-sm transition
                         hover:bg-primary-hover active:scale-[0.99]
                         focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30
                         disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy
                ? `Merging… ${progress}%`
                : anyLoading
                  ? "Reading files…"
                  : `Merge ${ready.length} PDFs`}
            </button>

            {busy && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {!busy && ready.length < 2 && !anyLoading && (
              <p className="text-center text-sm text-muted-foreground">
                Add at least two readable PDFs to merge.
              </p>
            )}
            {!busy && failed.length > 0 && (
              <p className="text-center text-sm text-red-600">
                {failed.length} unreadable {failed.length === 1 ? "file" : "files"} will be left
                out of the merged PDF.
              </p>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-red-600">{error}</p>}

      {result && (
        <div className="space-y-4 rounded-xl border border-border bg-card p-5 text-center">
          <p className="text-foreground">
            Merged <span className="font-bold">{ready.length}</span> files into{" "}
            <span className="font-bold">{result.pages}</span> pages{" "}
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