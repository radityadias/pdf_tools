"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import ActionButton from "@/components/layout/ActionButton"
import FileCard from "@/components/layout/FileCard"
import FileDropzone from "@/components/layout/FileDropzone"
import OptionCards from "@/components/layout/OptionCards"
import ResultCard from "@/components/layout/ResultCard"
import { usePdfDocument } from "@/hooks/usePdfDocument"
import { PDF_FILES } from "@/lib/files"
import { formatBytes as fmt } from "@/lib/format"
import {
  compressPdf,
  MAX_PAGES,
  MAX_TARGET_KB,
  MIN_TARGET_KB,
  type CompressProgress,
  type CompressResult,
  type Goal,
  type Preset,
} from "@/services/compress"

type Mode = "preset" | "target"
type Unit = "KB" | "MB"

const PRESETS: { value: Preset; title: string; desc: string }[] = [
  { value: "light", title: "Light", desc: "Best quality, larger file" },
  { value: "balanced", title: "Balanced", desc: "Recommended" },
  { value: "strong", title: "Strong", desc: "Smallest file, lower quality" },
]

const TARGET_CHIPS = [
  { kb: 100, label: "100 KB" },
  { kb: 200, label: "200 KB" },
  { kb: 500, label: "500 KB" },
  { kb: 1024, label: "1 MB" },
]

const MODES: { value: Mode; label: string }[] = [
  { value: "preset", label: "Quality level" },
  { value: "target", label: "Target file size" },
]

function splitTarget(kb: number): { value: string; unit: Unit } {
  return kb >= 1024 && kb % 1024 === 0
    ? { value: String(kb / 1024), unit: "MB" }
    : { value: String(kb), unit: "KB" }
}

type ResultState = CompressResult & { url: string | null }

export default function PdfCompressor({ defaultTargetKB }: { defaultTargetKB?: number }) {
  const initialTarget = splitTarget(defaultTargetKB ?? 200)

  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<Mode>(defaultTargetKB ? "target" : "preset")
  const [preset, setPreset] = useState<Preset>("balanced")
  const [targetValue, setTargetValue] = useState(initialTarget.value)
  const [unit, setUnit] = useState<Unit>(initialTarget.unit)
  const [grayscale, setGrayscale] = useState(false)

  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<CompressProgress>({ fraction: 0, status: "" })
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ResultState | null>(null)

  const urlRef = useRef<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const { totalPages, thumbs } = usePdfDocument(file, {
    limit: 1, // only page 1 is needed for the preview
    onError: (message) => {
      setError(message)
      setFile(null)
    },
  })

  // Stop a running compression and revoke the download URL when leaving the page
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      abortRef.current?.abort()
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

  function pick(files: File[]) {
    clearResult()
    setError(null)
    setFile(files[0])
  }

  function removeFile() {
    abortRef.current?.abort()
    clearResult()
    setError(null)
    setFile(null)
  }

  // Target size in KB, or null while the input is empty or invalid
  const targetKB = useMemo(() => {
    const n = Number(targetValue)
    if (!targetValue.trim() || !Number.isFinite(n) || n <= 0) return null
    return Math.round(unit === "MB" ? n * 1024 : n)
  }, [targetValue, unit])

  const targetError =
    mode !== "target"
      ? null
      : targetKB === null
        ? "Enter a target size."
        : targetKB < MIN_TARGET_KB || targetKB > MAX_TARGET_KB
          ? `Choose a size between ${MIN_TARGET_KB} KB and ${MAX_TARGET_KB / 1024} MB.`
          : null

  const alreadySmall =
    mode === "target" && targetKB !== null && !!file && file.size <= targetKB * 1024
  const tooManyPages = totalPages > MAX_PAGES

  async function handleCompress() {
    if (!file) return
    if (mode === "target" && (targetKB === null || targetError)) return

    const goal: Goal =
      mode === "target"
        ? { kind: "target", targetKB: targetKB as number }
        : { kind: "preset", preset }

    setBusy(true)
    setError(null)
    clearResult()
    setProgress({ fraction: 0, status: "Starting…" })

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await compressPdf(file, {
        goal,
        grayscale,
        signal: controller.signal,
        onProgress: setProgress,
      })

      // Only results that have a new file to download need a URL
      const hasFile = res.outcome === "compressed" || res.outcome === "target-missed"
      const url = hasFile ? URL.createObjectURL(res.blob) : null
      urlRef.current = url
      setResult({ ...res, url })
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setError("Compression cancelled.")
      } else {
        setError(e instanceof Error ? e.message : "Something went wrong")
      }
    } finally {
      setBusy(false)
      abortRef.current = null
    }
  }

  function summary(r: ResultState) {
    const percent = Math.round((1 - r.after / r.before) * 100)

    switch (r.outcome) {
      case "compressed":
        return (
          <>
            {fmt(r.before)} → <span className="font-bold">{fmt(r.after)}</span>{" "}
            <span className="text-muted-foreground">
              ({percent}% smaller
              {r.targetBytes ? `, under your ${fmt(r.targetBytes)} target` : ""})
            </span>
          </>
        )
      case "already-small":
        return (
          <>
            Your PDF is already <span className="font-bold">{fmt(r.before)}</span>, under your{" "}
            {fmt(r.targetBytes ?? 0)} target, so nothing was changed.
          </>
        )
      case "target-missed":
        return (
          <>
            Closest result: <span className="font-bold">{fmt(r.after)}</span>{" "}
            <span className="text-muted-foreground">
              (your target was {fmt(r.targetBytes ?? 0)}, original {fmt(r.before)})
            </span>
          </>
        )
      case "no-gain":
        return <>This PDF can&apos;t be made smaller this way, so your original was left unchanged.</>
    }
  }

  const linkClass =
    "font-medium text-primary underline underline-offset-2 hover:text-primary-hover"

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
          disabled={busy}
          onRemove={removeFile}
        />
      )}

      {/* Goal */}
      <div
        role="radiogroup"
        aria-label="Compression goal"
        className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-card p-1"
      >
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={mode === m.value}
            disabled={busy}
            onClick={() => {
              clearResult()
              setMode(m.value)
            }}
            className={`rounded-lg px-4 py-3 text-sm font-semibold transition disabled:opacity-60 ${
              mode === m.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "preset" ? (
        <OptionCards
          legend="Compression level"
          name="compress-preset"
          options={PRESETS}
          value={preset}
          onChange={(p) => {
            clearResult()
            setPreset(p)
          }}
          disabled={busy}
        />
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Make the PDF smaller than</p>

          <div className="flex flex-wrap gap-2">
            {TARGET_CHIPS.map((c) => (
              <button
                key={c.kb}
                type="button"
                disabled={busy}
                aria-pressed={targetKB === c.kb}
                onClick={() => {
                  clearResult()
                  const next = splitTarget(c.kb)
                  setTargetValue(next.value)
                  setUnit(next.unit)
                }}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                  targetKB === c.kb
                    ? "border-primary bg-secondary text-foreground ring-2 ring-primary/30"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              min={1}
              value={targetValue}
              onChange={(e) => {
                clearResult()
                setTargetValue(e.target.value)
              }}
              disabled={busy}
              aria-label="Custom target size"
              className="w-32 rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
            />
            <select
              value={unit}
              onChange={(e) => {
                clearResult()
                setUnit(e.target.value as Unit)
              }}
              disabled={busy}
              aria-label="Size unit"
              className="rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
            >
              <option value="KB">KB</option>
              <option value="MB">MB</option>
            </select>
          </div>

          <p className="text-sm text-muted-foreground">
            The tool picks the highest quality that still fits. Scanned and photo-heavy PDFs can
            reach small targets, but text-only PDFs usually can&apos;t.
          </p>
          {targetError && <p className="text-sm text-red-600">{targetError}</p>}
        </div>
      )}

      <label className="flex items-start gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={grayscale}
          onChange={(e) => {
            clearResult()
            setGrayscale(e.target.checked)
          }}
          disabled={busy}
          className="mt-0.5 h-4 w-4 accent-primary"
        />
        <span>
          Convert pages to black &amp; white
          <span className="block text-muted-foreground">
            Usually saves some space. Don&apos;t use it for colour documents.
          </span>
        </span>
      </label>

      {tooManyPages && (
        <p role="alert" className="text-red-600">
          This PDF has {totalPages} pages, and the compressor supports up to {MAX_PAGES}. Split it
          first with <Link href="/split-pdf" className={linkClass}>Split PDF</Link>.
        </p>
      )}

      <ActionButton
        label={
          mode === "target" && targetKB && !targetError
            ? `Compress to under ${fmt(targetKB * 1024)}`
            : "Compress PDF"
        }
        busyLabel={progress.status || "Compressing…"}
        busy={busy}
        progress={Math.round(progress.fraction * 100)}
        disabled={!file || !!targetError || alreadySmall || tooManyPages}
        onClick={handleCompress}
        onCancel={() => abortRef.current?.abort()}
      >
        {alreadySmall && !busy && (
          <p className="text-center text-sm text-muted-foreground">
            Your file ({file ? fmt(file.size) : ""}) is already under this size. Choose a smaller
            target.
          </p>
        )}
      </ActionButton>

      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}

      {result && (
        <div className="space-y-3">
          <ResultCard
            action={
              result.url
                ? {
                    type: "link",
                    href: result.url,
                    filename: `compressed-${file?.name ?? "file.pdf"}`,
                    label: "Download",
                  }
                : undefined
            }
          >
            {summary(result)}
          </ResultCard>

          {result.dpi !== undefined && result.dpi < 72 && (
            <p className="text-sm text-muted-foreground">
              To reach this size, pages were reduced to about {result.dpi} DPI, so small text may be
              hard to read. Zoom in and check the result before you send it.
            </p>
          )}

          {result.outcome === "no-gain" && (
            <p className="text-sm text-muted-foreground">
              PDFs that are mostly text are already compact, and rebuilding them as images would
              make them larger.
            </p>
          )}

          {result.outcome === "target-missed" && (
            <div className="text-sm text-muted-foreground">
              <p>This file can&apos;t quite reach your target. You could:</p>
              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li>Turn on black &amp; white, which usually saves some space.</li>
                <li>
                  Remove pages you don&apos;t need with{" "}
                  <Link href="/reorder-pdf" className={linkClass}>Reorder PDF</Link>.
                </li>
                <li>
                  Cut the document into parts with{" "}
                  <Link href="/split-pdf" className={linkClass}>Split PDF</Link>.
                </li>
                <li>Or choose a slightly larger target.</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}