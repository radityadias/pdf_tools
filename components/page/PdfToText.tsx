"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import ActionButton from "@/components/layout/ActionButton"
import FileCard from "@/components/layout/FileCard"
import FileDropzone from "@/components/layout/FileDropzone"
import OptionCards from "@/components/layout/OptionCards"
import ResultCard from "@/components/layout/ResultCard"
import { usePdfDocument } from "@/hooks/usePdfDocument"
import { saveBlob } from "@/lib/download"
import { PDF_FILES } from "@/lib/files"
import {
  extractPdfText,
  formatPageList,
  joinPages,
  MAX_OCR_PAGES,
  MAX_PAGES,
  OCR_LANGUAGES,
  type ExtractProgress,
  type OcrMode,
  type PageText,
} from "@/services/pdf-to-text"
import { parseRanges } from "@/services/split"

const MODES: { value: OcrMode; title: string; desc: string }[] = [
  { value: "auto", title: "Auto", desc: "Reads text directly, uses OCR on scanned pages" },
  { value: "text", title: "Text only", desc: "Fastest. Scanned pages come out empty" },
  { value: "ocr", title: "OCR all pages", desc: "Reads every page as an image" },
]

export default function PdfToText() {
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<OcrMode>("auto")
  const [langs, setLangs] = useState("eng")
  const [rangeInput, setRangeInput] = useState("")
  const [separators, setSeparators] = useState(false)

  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<ExtractProgress>({ fraction: 0, status: "" })
  const [error, setError] = useState<string | null>(null)
  const [pages, setPages] = useState<PageText[] | null>(null)
  const [copied, setCopied] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { totalPages, thumbs } = usePdfDocument(file, {
    limit: 1, // only page 1 is needed for the preview
    onError: (message) => {
      setError(message)
      setFile(null)
    },
  })

  // Stop a running extraction and clear the timer when leaving the page
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      abortRef.current?.abort()
      if (copyTimer.current) clearTimeout(copyTimer.current)
    }
  }, [])

  function clearResult() {
    setPages(null)
    setCopied(false)
  }

  function pick(files: File[]) {
    clearResult()
    setRangeInput("")
    setFile(files[0])
  }

  function removeFile() {
    abortRef.current?.abort()
    clearResult()
    setRangeInput("")
    setFile(null)
  }

  // Which pages will be processed, computed live from the range input
  const plan = useMemo<{ pages: number[] | null; error: string | null }>(() => {
    if (!file || totalPages === 0) return { pages: null, error: null }

    try {
      const selected = rangeInput.trim()
        ? [...new Set(parseRanges(rangeInput, totalPages).flat())].sort((a, b) => a - b)
        : Array.from({ length: totalPages }, (_, i) => i)

      if (selected.length > MAX_PAGES) {
        throw new Error(
          `That's ${selected.length} pages. Extract at most ${MAX_PAGES} at a time. Use a page range to pick a smaller part.`
        )
      }
      return { pages: selected, error: null }
    } catch (e) {
      return { pages: null, error: e instanceof Error ? e.message : "Invalid page range" }
    }
  }, [file, totalPages, rangeInput])

  async function handleExtract() {
    if (!file || !plan.pages) return

    setBusy(true)
    setError(null)
    clearResult()
    setProgress({ fraction: 0, status: "Starting…" })

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const result = await extractPdfText(file, {
        pages: plan.pages,
        mode,
        langs,
        signal: controller.signal,
        onProgress: setProgress,
      })
      setPages(result)
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setError("Extraction cancelled.")
      } else {
        setError(e instanceof Error ? e.message : "Something went wrong")
      }
    } finally {
      setBusy(false)
      abortRef.current = null
    }
  }

  // Derived from the result
  const plain = useMemo(() => (pages ? joinPages(pages, false) : ""), [pages])
  const text = useMemo(() => (pages ? joinPages(pages, separators) : ""), [pages, separators])
  const words = plain.trim() ? plain.trim().split(/\s+/).length : 0
  const ocrPages = pages?.filter((p) => p.method === "ocr").map((p) => p.pageNumber) ?? []
  const emptyPages = pages?.filter((p) => p.text.trim() === "").map((p) => p.pageNumber) ?? []

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      setError("Could not copy automatically. Select the text and copy it manually.")
    }
  }

  function handleDownload() {
    if (!file) return
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
    saveBlob(blob, `${file.name.replace(/\.pdf$/i, "")}.txt`)
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      <FileDropzone
        accept={PDF_FILES}
        onFiles={pick}
        onError={setError}
        disabled={busy}
        buttonLabel={file ? "Choose another PDF" : "Choose PDF"}
      />

      {file && (
        <FileCard
          file={file}
          thumbnail={thumbs[0]}
          pages={totalPages || undefined}
          onRemove={removeFile}
        />
      )}

      {file && totalPages > 0 && (
        <>
          <OptionCards
            legend="Extraction mode"
            name="text-mode"
            options={MODES}
            value={mode}
            onChange={(m) => { clearResult(); setMode(m) }}
            disabled={busy}
          />

          {mode !== "text" && (
            <div className="space-y-2">
              <label htmlFor="ocr-lang" className="block text-sm font-semibold text-foreground">
                Document language (for OCR)
              </label>
              <select
                id="ocr-lang"
                value={langs}
                onChange={(e) => { clearResult(); setLangs(e.target.value) }}
                disabled={busy}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
              >
                {OCR_LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
              <p className="text-sm text-muted-foreground">
                Pick the language the document is written in. The wrong language gives poor results.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="text-ranges" className="block text-sm font-semibold text-foreground">
              Pages <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              id="text-ranges"
              type="text"
              value={rangeInput}
              onChange={(e) => { clearResult(); setRangeInput(e.target.value) }}
              placeholder={`Leave empty for all ${totalPages} pages, or type e.g. 1-3, 5, 8-`}
              disabled={busy}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
            />
          </div>

          {plan.error && <p className="text-red-600">{plan.error}</p>}

          <ActionButton
            label="Extract text"
            busyLabel={progress.status || "Extracting…"}
            busy={busy}
            progress={Math.round(progress.fraction * 100)}
            disabled={!plan.pages}
            onClick={handleExtract}
            onCancel={() => abortRef.current?.abort()}
          >
            {plan.pages && !busy && (
              <p className="text-center text-sm text-muted-foreground">
                {plan.pages.length} {plan.pages.length === 1 ? "page" : "pages"} will be processed.
                {mode !== "text" &&
                  ` Scanned pages are read with OCR (up to ${MAX_OCR_PAGES} per run, a few seconds each).`}
              </p>
            )}
          </ActionButton>
        </>
      )}

      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}

      {pages && (
        <div className="space-y-4">
          <ResultCard action={{ type: "button", onClick: handleDownload, label: "Download .txt" }}>
            <span className="font-bold">{pages.length}</span> {pages.length === 1 ? "page" : "pages"} ·{" "}
            <span className="font-bold">{words.toLocaleString()}</span> words{" "}
            <span className="text-muted-foreground">({plain.length.toLocaleString()} characters)</span>
          </ResultCard>

          {ocrPages.length > 0 && (
            <p className="text-sm text-muted-foreground">
              OCR was used on {ocrPages.length === 1 ? "page" : "pages"} {formatPageList(ocrPages)}.
              OCR can make small mistakes, so proofread anything important.
            </p>
          )}

          {emptyPages.length > 0 && (
            <p className="text-sm text-muted-foreground">
              No text was found on {emptyPages.length === 1 ? "page" : "pages"}{" "}
              {formatPageList(emptyPages)}. {mode === "text"
                ? "These may be scanned images. Try Auto or OCR mode."
                : "They may be blank or contain only pictures."}
            </p>
          )}

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={separators}
                  onChange={(e) => setSeparators(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                Add page separators
              </label>

              <button
                type="button"
                onClick={handleCopy}
                disabled={!text}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:opacity-50"
              >
                {copied ? "Copied!" : "Copy text"}
              </button>
            </div>

            <textarea
              readOnly
              value={text}
              rows={16}
              aria-label="Extracted text"
              className="w-full rounded-xl border border-border bg-card p-4 font-mono text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      )}
    </div>
  )
}