/* eslint-disable @next/next/no-img-element */
"use client"

import {
  ChevronLeft,
  ChevronRight,
  Copy,
  RotateCcw,
  RotateCw,
  Trash2,
  Undo2,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import ActionButton from "@/components/layout/ActionButton"
import FileCard from "@/components/layout/FileCard"
import FileDropzone from "@/components/layout/FileDropzone"
import ResultCard from "@/components/layout/ResultCard"
import { usePdfDocument } from "@/hooks/usePdfDocument"
import { PDF_FILES } from "@/lib/files"
import { formatBytes as fmt } from "@/lib/format"
import { safeFilename } from "@/services/merge"
import {
  hasChanges,
  initialItems,
  MAX_REORDER_PAGES,
  reorderPdf,
  rotateBy,
  toEdits,
  type PageItem,
} from "@/services/reorder"
import { MAX_THUMBS } from "@/services/thumbnails"

const HISTORY_LIMIT = 50

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  )
}

function ToolbarButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  )
}

export default function PdfReorder() {
  const [file, setFile] = useState<File | null>(null)
  // null = untouched, so the list is derived from the page count until the first edit
  const [edited, setEdited] = useState<PageItem[] | null>(null)
  const [history, setHistory] = useState<PageItem[][]>([])
  const [outName, setOutName] = useState("reordered")

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    url: string
    filename: string
    size: number
    pages: number
  } | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const dragId = useRef<string | null>(null)
  const dupCount = useRef(0)
  const urlRef = useRef<string | null>(null)

  const { totalPages, thumbs } = usePdfDocument(file, {
    onError: (message) => {
      setError(message)
      setFile(null)
    },
  })

  const tooMany = totalPages > MAX_REORDER_PAGES

  const items = useMemo<PageItem[]>(
    () => (tooMany ? [] : (edited ?? initialItems(totalPages))),
    [tooMany, edited, totalPages]
  )

  // Position of each kept page in the new PDF (deleted pages get none)
  const positions = useMemo(() => {
    let n = 0
    return items.map((i) => (i.deleted ? null : ++n))
  }, [items])

  const kept = items.filter((i) => !i.deleted).length
  const deletedCount = items.length - kept
  const changed = hasChanges(items, totalPages)

  // Revoke the download URL when leaving the page
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [])

  function clearResult() {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
    setResult(null)
  }

  function resetEditor() {
    clearResult()
    setEdited(null)
    setHistory([])
    dupCount.current = 0
  }

  function pick(files: File[]) {
    resetEditor()
    setError(null)
    setOutName(`${files[0].name.replace(/\.pdf$/i, "")}-reordered`)
    setFile(files[0])
  }

  function removeFile() {
    resetEditor()
    setError(null)
    setFile(null)
  }

  /** Every edit goes through here, so undo and result-clearing work everywhere */
  function commit(next: PageItem[]) {
    clearResult()
    setHistory((h) => [...h.slice(-(HISTORY_LIMIT - 1)), items])
    setEdited(next)
  }

  function undo() {
    const previous = history[history.length - 1]
    if (!previous) return
    clearResult()
    setHistory((h) => h.slice(0, -1))
    setEdited(previous)
  }

  function rotate(id: string, delta: 90 | -90) {
    commit(items.map((i) => (i.id === id ? { ...i, rotation: rotateBy(i.rotation, delta) } : i)))
  }

  function rotateAll(delta: 90 | -90) {
    commit(items.map((i) => ({ ...i, rotation: rotateBy(i.rotation, delta) })))
  }

  function toggleDelete(id: string) {
    commit(items.map((i) => (i.id === id ? { ...i, deleted: !i.deleted } : i)))
  }

  function duplicate(id: string) {
    const index = items.findIndex((i) => i.id === id)
    if (index < 0) return
    const copy: PageItem = { ...items[index], id: `d${dupCount.current++}`, deleted: false }
    const next = [...items]
    next.splice(index + 1, 0, copy)
    commit(next)
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    commit(next)
  }

  function reorder(fromId: string, toId: string) {
    const from = items.findIndex((i) => i.id === fromId)
    const to = items.findIndex((i) => i.id === toId)
    if (from < 0 || to < 0 || from === to) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    commit(next)
  }

  function reverse() {
    commit([...items].reverse())
  }

  function originalOrder() {
    commit([...items].sort((a, b) => a.source - b.source)) // stable, so duplicates stay together
  }

  function resetAll() {
    commit(initialItems(totalPages))
  }

  async function handleApply() {
    if (!file || kept === 0) return

    setBusy(true)
    setError(null)
    clearResult()

    try {
      const filename = safeFilename(outName, "reordered")
      const { blob, pages } = await reorderPdf(file, toEdits(items), {
        title: filename.replace(/\.pdf$/i, ""),
      })
      const url = URL.createObjectURL(blob)
      urlRef.current = url
      setResult({ url, filename, size: blob.size, pages })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <FileDropzone
        accept={PDF_FILES}
        onFiles={pick}
        onError={setError}
        disabled={busy}
        buttonLabel={file ? "Choose another PDF" : "Choose PDF"}
        className="mx-auto max-w-3xl"
      />

      {file && (
        <FileCard
          file={file}
          thumbnail={thumbs[0]}
          pages={totalPages || undefined}
          disabled={busy}
          onRemove={removeFile}
          className="mx-auto max-w-3xl"
        />
      )}

      {tooMany && (
        <p role="alert" className="text-center text-red-600">
          This PDF has {totalPages} pages. The page editor supports up to {MAX_REORDER_PAGES}. Use
          the Split PDF tool to cut it into smaller parts first.
        </p>
      )}

      {items.length > 0 && (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-auto text-sm font-semibold text-foreground">
              {kept} {kept === 1 ? "page" : "pages"} in the new PDF
              {deletedCount > 0 && (
                <span className="font-normal text-muted-foreground"> · {deletedCount} deleted</span>
              )}
            </span>
            <ToolbarButton onClick={undo} disabled={busy || history.length === 0}>
              <Undo2 className="h-4 w-4" aria-hidden /> Undo
            </ToolbarButton>
            <ToolbarButton onClick={() => rotateAll(-90)} disabled={busy}>
              <RotateCcw className="h-4 w-4" aria-hidden /> Rotate all
            </ToolbarButton>
            <ToolbarButton onClick={() => rotateAll(90)} disabled={busy}>
              <RotateCw className="h-4 w-4" aria-hidden /> Rotate all
            </ToolbarButton>
            <ToolbarButton onClick={reverse} disabled={busy || items.length < 2}>
              Reverse
            </ToolbarButton>
            <ToolbarButton onClick={originalOrder} disabled={busy || !changed}>
              Original order
            </ToolbarButton>
            <ToolbarButton onClick={resetAll} disabled={busy || !changed}>
              Reset all
            </ToolbarButton>
          </div>

          {/* Page grid */}
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {items.map((item, i) => {
              const thumb = thumbs[item.source]
              const loading = item.source < MAX_THUMBS && !thumb
              const quarterTurn = item.rotation === 90 || item.rotation === 270

              return (
                <li
                  key={item.id}
                  draggable={!busy}
                  onDragStart={(e) => {
                    dragId.current = item.id
                    e.dataTransfer.effectAllowed = "move"
                    e.dataTransfer.setData("text/plain", item.id) // Firefox needs this
                  }}
                  onDragOver={(e) => {
                    if (!dragId.current) return // ignore files dragged in from the OS
                    e.preventDefault()
                    setOverId(item.id)
                  }}
                  onDrop={(e) => {
                    if (!dragId.current) return
                    e.preventDefault()
                    reorder(dragId.current, item.id)
                    dragId.current = null
                    setOverId(null)
                  }}
                  onDragEnd={() => {
                    dragId.current = null
                    setOverId(null)
                  }}
                  className={`rounded-xl border bg-card p-2 transition ${
                    overId === item.id && dragId.current !== item.id
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border"
                  } ${busy ? "" : "cursor-grab active:cursor-grabbing"}`}
                >
                  <div
                    className={`relative aspect-[3/4] w-full overflow-hidden rounded border border-border bg-secondary ${
                      item.deleted ? "opacity-40" : ""
                    }`}
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={`Original page ${item.source + 1}`}
                        draggable={false}
                        style={{
                          // A quarter turn swaps width and height, so shrink it to the 3:4 box
                          transform: `rotate(${item.rotation}deg)${quarterTurn ? " scale(0.75)" : ""}`,
                        }}
                        className="absolute inset-0 h-full w-full object-contain transition-transform"
                      />
                    ) : (
                      <div
                        className={`grid h-full w-full place-items-center text-2xl font-bold text-muted-foreground ${
                          loading ? "animate-pulse" : ""
                        }`}
                      >
                        {item.source + 1}
                      </div>
                    )}

                    <span className="absolute left-1.5 top-1.5 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                      {positions[i] ?? "–"}
                    </span>
                  </div>

                  {item.deleted && (
                    <p className="mt-1 text-center text-xs font-semibold text-red-600">Deleted</p>
                  )}
                  <p className="mt-1 text-center text-xs text-muted-foreground">
                    Original page {item.source + 1}
                    {item.rotation !== 0 && ` · rotated ${item.rotation}°`}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center justify-center gap-0.5">
                    <IconButton
                      label="Move earlier"
                      onClick={() => move(i, -1)}
                      disabled={busy || i === 0}
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden />
                    </IconButton>
                    <IconButton
                      label="Move later"
                      onClick={() => move(i, 1)}
                      disabled={busy || i === items.length - 1}
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </IconButton>
                    <IconButton
                      label="Rotate left"
                      onClick={() => rotate(item.id, -90)}
                      disabled={busy || item.deleted}
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden />
                    </IconButton>
                    <IconButton
                      label="Rotate right"
                      onClick={() => rotate(item.id, 90)}
                      disabled={busy || item.deleted}
                    >
                      <RotateCw className="h-4 w-4" aria-hidden />
                    </IconButton>
                    <IconButton
                      label="Duplicate page"
                      onClick={() => duplicate(item.id)}
                      disabled={busy || item.deleted}
                    >
                      <Copy className="h-4 w-4" aria-hidden />
                    </IconButton>
                    <IconButton
                      label={item.deleted ? "Restore page" : "Delete page"}
                      onClick={() => toggleDelete(item.id)}
                      disabled={busy}
                    >
                      {item.deleted ? (
                        <Undo2 className="h-4 w-4" aria-hidden />
                      ) : (
                        <Trash2 className="h-4 w-4" aria-hidden />
                      )}
                    </IconButton>
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Drag pages to reorder, or use the arrows. On phones, use the arrows.</p>
            {totalPages > MAX_THUMBS && (
              <p>
                Previews are shown for the first {MAX_THUMBS} pages. Later pages appear as numbered
                tiles and can be edited the same way.
              </p>
            )}
          </div>

          {/* Output + action */}
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="space-y-2">
              <label htmlFor="reorder-name" className="block text-sm font-semibold text-foreground">
                Output file name
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="reorder-name"
                  type="text"
                  value={outName}
                  onChange={(e) => setOutName(e.target.value)}
                  disabled={busy}
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                />
                <span className="text-muted-foreground">.pdf</span>
              </div>
            </div>

            <ActionButton
              label="Apply changes and create PDF"
              busyLabel="Creating PDF…"
              busy={busy}
              disabled={!changed || kept === 0}
              onClick={handleApply}
            >
              {!changed && !busy && (
                <p className="text-center text-sm text-muted-foreground">
                  Make a change first: drag pages, rotate, duplicate or delete.
                </p>
              )}
              {kept === 0 && !busy && (
                <p className="text-center text-sm text-red-600">At least one page must remain.</p>
              )}
            </ActionButton>
          </div>
        </>
      )}

      {error && (
        <p role="alert" className="mx-auto max-w-3xl text-red-600">
          {error}
        </p>
      )}

      {result && (
        <ResultCard
          className="mx-auto max-w-3xl"
          action={{ type: "link", href: result.url, filename: result.filename, label: "Download PDF" }}
        >
          Created a PDF with <span className="font-bold">{result.pages}</span>{" "}
          {result.pages === 1 ? "page" : "pages"}{" "}
          <span className="text-muted-foreground">({fmt(result.size)})</span>
        </ResultCard>
      )}
    </div>
  )
}