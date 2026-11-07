/* eslint-disable @next/next/no-img-element */
"use client"

import FileDropzone from "../layout/FileDropzone"
import { PDF_FILES } from "@/lib/files"
import { formatBytes as fmt } from "@/lib/format"
import { useEffect, useMemo, useState } from "react"
import { chunkPages, packFiles, parseRanges, splitPdf, type PageGroup } from "@/services/split"
import { loadPdfThumbnails, MAX_THUMBS } from "@/services/thumbnails"

type Mode = "ranges" | "fixed" | "select"

const MODES: { value: Mode; title: string; desc: string }[] = [
  { value: "ranges", title: "By range", desc: "Type pages like 1-3, 5, 8-" },
  { value: "fixed", title: "Every N pages", desc: "Cut into equal parts" },
  { value: "select", title: "Select pages", desc: "Click the pages you want" },
]

export default function PdfSplit() {
  const [file, setFile] = useState<File | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [thumbs, setThumbs] = useState<(string | undefined)[]>([])
  const [dragging, setDragging] = useState(false)

  const [mode, setMode] = useState<Mode>("ranges")
  const [rangeInput, setRangeInput] = useState("")
  const [chunkInput, setChunkInput] = useState("1")
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [combine, setCombine] = useState(false)

  const [progress, setProgress] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    url: string
    filename: string
    size: number
    count: number
  } | null>(null)

  // Load page count + thumbnails whenever a new file is picked
  useEffect(() => {
    if (!file) return

    const controller = new AbortController()
    loadPdfThumbnails(file, {
      signal: controller.signal,
      onMeta: (n) => setTotalPages(n),
      onThumb: (i, url) =>
        setThumbs((prev) => {
          const next = prev.slice()
          next[i] = url
          return next
        }),
    }).catch(() => {
      if (controller.signal.aborted) return
      setError("Could not read this PDF. It may be password-protected or damaged.")
      setFile(null)
    })

    return () => controller.abort()
  }, [file])

  function clearResult() {
    if (result) URL.revokeObjectURL(result.url)
    setResult(null)
  }

  function resetDocument() {
    clearResult()
    setTotalPages(0)
    setThumbs([])
    setSelected(new Set())
  }

  function pick(files: File[] | null) {
    if (!files) return
    setError(null)
    resetDocument()
    setFile(files[0])
  }

  function removeFile() {
    resetDocument()
    setFile(null)
  }

  function toggle(i: number) {
    clearResult()
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  function selectAll() {
    clearResult()
    setSelected(new Set(Array.from({ length: totalPages }, (_, i) => i)))
  }

  function invertSelection() {
    clearResult()
    setSelected(
      new Set(
        Array.from({ length: totalPages }, (_, i) => i).filter((i) => !selected.has(i))
      )
    )
  }

  // What will be produced, computed live from the current inputs
  const plan = useMemo<{ groups: PageGroup[] | null; error: string | null }>(() => {
    if (!file || totalPages === 0) return { groups: null, error: null }

    try {
      if (mode === "ranges") {
        if (!rangeInput.trim()) return { groups: null, error: null }
        const groups = parseRanges(rangeInput, totalPages)
        return { groups: combine ? [groups.flat()] : groups, error: null }
      }

      if (mode === "fixed") {
        const size = Number(chunkInput)
        if (!Number.isInteger(size) || size < 1) {
          throw new Error("Enter a whole number of pages, 1 or more.")
        }
        return { groups: chunkPages(totalPages, size), error: null }
      }

      if (selected.size === 0) return { groups: null, error: null }
      const sorted = [...selected].sort((a, b) => a - b)
      return { groups: combine ? [sorted] : sorted.map((p) => [p]), error: null }
    } catch (e) {
      return { groups: null, error: e instanceof Error ? e.message : "Invalid input" }
    }
  }, [file, totalPages, mode, rangeInput, chunkInput, combine, selected])

  async function handleSplit() {
    if (!file || !plan.groups) return
    setBusy(true)
    setError(null)
    setProgress(0)
    clearResult()

    try {
      const files = await splitPdf(file, plan.groups, (done, total) =>
        setProgress(Math.round((done / total) * 100))
      )
      const { blob, filename } = packFiles(files, file)
      setResult({
        url: URL.createObjectURL(blob),
        filename,
        size: blob.size,
        count: files.length,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      {/* Upload */}
      <FileDropzone
        accept={PDF_FILES}
        onFiles={pick}
        onError={setError}
        disabled={busy}
        buttonLabel={file ? "Choose another PDF" : "Choose PDF"}
      />

      {file && (
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
          {thumbs[0] ? (
            <img
              src={thumbs[0]}
              alt="First page preview"
              className="h-24 w-auto rounded border border-border shadow-sm"
            />
          ) : (
            <div className="h-24 w-[68px] shrink-0 animate-pulse rounded bg-secondary" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-foreground">{file.name}</p>
            <p className="text-sm text-muted-foreground">
              {fmt(file.size)}
              {totalPages > 0 && ` · ${totalPages} ${totalPages === 1 ? "page" : "pages"}`}
            </p>
          </div>
          <button
            onClick={removeFile}
            disabled={busy}
            aria-label="Remove file"
            className="rounded-lg px-3 py-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-50"
          >
            ✕
          </button>
        </div>
      )}

      {file && totalPages > 0 && (
        <>
          {/* Mode picker */}
          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-foreground">Split mode</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {MODES.map((m) => (
                <label key={m.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="split-mode"
                    value={m.value}
                    checked={mode === m.value}
                    onChange={() => {
                      clearResult()
                      setMode(m.value)
                      setCombine(m.value === "select") // select defaults to one combined PDF
                    }}
                    disabled={busy}
                    className="peer sr-only"
                  />
                  <div
                    className="h-full rounded-xl border border-border bg-card p-4 transition
                               hover:border-primary/50
                               peer-checked:border-primary peer-checked:bg-secondary peer-checked:ring-2 peer-checked:ring-primary/30
                               peer-focus-visible:ring-2 peer-focus-visible:ring-primary
                               peer-disabled:cursor-not-allowed peer-disabled:opacity-60"
                  >
                    <p className="font-semibold text-foreground">{m.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{m.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Mode options */}
          {mode === "ranges" && (
            <div className="space-y-3">
              <label htmlFor="ranges" className="block text-sm font-semibold text-foreground">
                Pages to extract
              </label>
              <input
                id="ranges"
                type="text"
                value={rangeInput}
                onChange={(e) => { clearResult(); setRangeInput(e.target.value) }}
                placeholder="e.g. 1-3, 5, 8-"
                disabled={busy}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
              />
              <p className="text-sm text-muted-foreground">
                Separate with commas. <code>8-</code> means page 8 to the end. This PDF has{" "}
                {totalPages} pages.
              </p>
            </div>
          )}

          {mode === "fixed" && (
            <div className="space-y-3">
              <label htmlFor="chunk" className="block text-sm font-semibold text-foreground">
                Split every
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="chunk"
                  type="number"
                  min={1}
                  value={chunkInput}
                  onChange={(e) => { clearResult(); setChunkInput(e.target.value) }}
                  disabled={busy}
                  className="w-28 rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                />
                <span className="text-foreground">page(s)</span>
              </div>
            </div>
          )}

          {mode === "select" && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-auto text-sm font-semibold text-foreground">
                  {selected.size} of {totalPages} selected
                </span>
                {[
                  { label: "Select all", onClick: selectAll },
                  { label: "Invert", onClick: invertSelection },
                  { label: "Clear", onClick: () => { clearResult(); setSelected(new Set()) } },
                ].map((b) => (
                  <button
                    key={b.label}
                    onClick={b.onClick}
                    disabled={busy}
                    className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground transition hover:bg-secondary disabled:opacity-50"
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              <div className="grid max-h-[28rem] grid-cols-3 gap-3 overflow-y-auto rounded-xl border border-border bg-background p-3 sm:grid-cols-4 md:grid-cols-5">
                {Array.from({ length: totalPages }, (_, i) => {
                  const on = selected.has(i)
                  const loading = i < MAX_THUMBS && !thumbs[i]
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggle(i)}
                      disabled={busy}
                      aria-pressed={on}
                      aria-label={`Page ${i + 1}`}
                      className={`relative flex flex-col items-center gap-1 rounded-xl border p-2 transition disabled:opacity-60 ${
                        on
                          ? "border-primary bg-secondary ring-2 ring-primary/30"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      {thumbs[i] ? (
                        <img src={thumbs[i]} alt="" className="h-auto w-full rounded border border-border" />
                      ) : (
                        <div
                          className={`aspect-[3/4] w-full rounded bg-secondary ${
                            loading ? "animate-pulse" : ""
                          }`}
                        />
                      )}
                      <span className="text-xs text-muted-foreground">{i + 1}</span>
                      {on && (
                        <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-xs text-primary-foreground">
                          ✓
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {totalPages > MAX_THUMBS && (
                <p className="text-sm text-muted-foreground">
                  Previews are shown for the first {MAX_THUMBS} pages. Later pages can still be
                  selected by number.
                </p>
              )}
            </div>
          )}

          {mode !== "fixed" && (
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={combine}
                onChange={(e) => { clearResult(); setCombine(e.target.checked) }}
                disabled={busy}
                className="h-4 w-4 accent-primary"
              />
              {mode === "ranges"
                ? "Combine all ranges into one PDF"
                : "Combine selected pages into one PDF (otherwise one file per page)"}
            </label>
          )}

          {plan.error && <p className="text-red-600">{plan.error}</p>}

          {/* Action */}
          <div className="space-y-2">
            <button
              onClick={handleSplit}
              disabled={!plan.groups || busy}
              className="w-full rounded-xl bg-primary px-6 py-4 text-lg font-bold text-primary-foreground shadow-sm transition
                         hover:bg-primary-hover active:scale-[0.99]
                         focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30
                         disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? `Splitting… ${progress}%` : "Split PDF"}
            </button>

            {plan.groups && !busy && (
              <p className="text-center text-sm text-muted-foreground">
                This will create {plan.groups.length}{" "}
                {plan.groups.length === 1 ? "PDF" : "PDFs (downloaded as a ZIP)"}.
              </p>
            )}

            {busy && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </>
      )}

      {error && <p className="text-red-600">{error}</p>}

      {result && (
        <div className="space-y-4 rounded-xl border border-border bg-card p-5 text-center">
          <p className="text-foreground">
            Created <span className="font-bold">{result.count}</span>{" "}
            {result.count === 1 ? "PDF" : "PDFs"}{" "}
            <span className="text-muted-foreground">({fmt(result.size)})</span>
          </p>
          <a
            href={result.url}
            download={result.filename}
            className="inline-block rounded-xl bg-accent px-6 py-3 font-bold text-accent-foreground transition hover:brightness-95"
          >
            {result.count > 1 ? "Download ZIP" : "Download PDF"}
          </a>
        </div>
      )}
    </div>
  )
}