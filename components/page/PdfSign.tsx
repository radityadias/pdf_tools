/* eslint-disable @next/next/no-img-element */
"use client"

import { ChevronLeft, ChevronRight, Copy, Minus, Plus, Trash2 } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import ActionButton from "@/components/layout/ActionButton"
import FileDropzone from "@/components/layout/FileDropzone"
import PageStage from "@/components/page/sign/PageStage"
import PlacedSignature from "@/components/page/sign/PlacedSignature"
import SignatureCreator, { InkPicker } from "@/components/page/sign/SignatureCreator"
import ResultCard from "@/components/layout/ResultCard"
import { usePdfDoc } from "@/hooks/usePdfDoc"
import { PDF_FILES } from "@/lib/files"
import { formatBytes as fmt } from "@/lib/format"
import { safeFilename } from "@/services/merge"
import { signPdf, MAX_SIGN_PAGES, type PlacedItem, type SignatureAsset } from "@/services/sign"
import { createTextStamp, INK_COLORS, newId } from "@/services/signature-assets"

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
const pad2 = (n: number) => String(n).padStart(2, "0")

const STAMP_SIZES = [
  { pt: 10, label: "Small" },
  { pt: 12, label: "Medium" },
  { pt: 16, label: "Large" },
]

const DATE_FORMATS = [
  {
    id: "id",
    label: "Indonesian: 15 Agustus 2026",
    format: (d: Date) =>
      d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
  },
  {
    id: "en",
    label: "English: 15 August 2026",
    format: (d: Date) =>
      d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
  },
  {
    id: "numeric",
    label: "Numeric: 15/08/2026",
    format: (d: Date) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`,
  },
  {
    id: "iso",
    label: "ISO: 2026-08-15",
    format: (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
  },
]

const secondaryButton =
  "inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"

export default function PdfSign() {
  const [file, setFile] = useState<File | null>(null)
  const [assets, setAssets] = useState<SignatureAsset[]>([])
  const [items, setItems] = useState<PlacedItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [showCreator, setShowCreator] = useState(true)

  const [stampText, setStampText] = useState("")
  const [stampPt, setStampPt] = useState(12)
  const [stampColor, setStampColor] = useState(INK_COLORS[0].value)
  const [dateFormat, setDateFormat] = useState(DATE_FORMATS[0].id)

  const [outName, setOutName] = useState("signed")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    url: string
    filename: string
    size: number
    pages: number
  } | null>(null)

  const urlRef = useRef<string | null>(null)

  const pdf = usePdfDoc(file, (message) => {
    setError(message)
    setFile(null)
  })
  const numPages = pdf?.numPages ?? 0
  const tooMany = numPages > MAX_SIGN_PAGES

  const assetMap = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets])
  const pageItems = items.filter((i) => i.page === pageIndex)
  const selected = items.find((i) => i.id === selectedId) ?? null
  const pagesWithItems = new Set(items.map((i) => i.page)).size

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

  function reset() {
    clearResult()
    setItems([])
    setSelectedId(null)
    setPageIndex(0)
  }

  function pick(files: File[]) {
    reset()
    setError(null)
    setOutName(`${files[0].name.replace(/\.pdf$/i, "")}-signed`)
    setFile(files[0])
  }

  function removeFile() {
    reset()
    setError(null)
    setFile(null)
  }

  function goToPage(n: number) {
    setPageIndex(clamp(n, 0, Math.max(0, numPages - 1)))
    setSelectedId(null)
  }

  function place(asset: SignatureAsset) {
    clearResult()
    const w = asset.defaultW
    const item: PlacedItem = {
      id: newId("i"),
      page: pageIndex,
      assetId: asset.id,
      x: (1 - w) / 2,
      y: 0.65,
      w,
    }
    setItems((prev) => [...prev, item])
    setSelectedId(item.id)
  }

  function addAsset(asset: SignatureAsset) {
    setAssets((prev) => [...prev, asset])
    place(asset)
    setShowCreator(false)
  }

  function removeAsset(id: string) {
    clearResult()
    setAssets((prev) => prev.filter((a) => a.id !== id))
    setItems((prev) => prev.filter((i) => i.assetId !== id))
    setSelectedId(null)
  }

  function updateItem(id: string, change: (item: PlacedItem) => Partial<PlacedItem>) {
    clearResult()
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...change(i) } : i)))
  }

  function removeItem(id: string) {
    clearResult()
    setItems((prev) => prev.filter((i) => i.id !== id))
    setSelectedId(null)
  }

  function resize(id: string, factor: number) {
    updateItem(id, (it) => {
      const w = clamp(it.w * factor, 0.04, 0.95)
      return { w, x: Math.min(it.x, 1 - w) }
    })
  }

  function copyToAllPages(id: string) {
    const source = items.find((i) => i.id === id)
    if (!source) return
    clearResult()
    setItems((prev) => {
      const additions: PlacedItem[] = []
      for (let p = 0; p < numPages; p++) {
        if (p === source.page) continue
        const exists = prev.some(
          (i) =>
            i.page === p &&
            i.assetId === source.assetId &&
            Math.abs(i.x - source.x) < 0.001 &&
            Math.abs(i.y - source.y) < 0.001
        )
        if (!exists) additions.push({ ...source, id: newId("i"), page: p })
      }
      return [...prev, ...additions]
    })
  }

  function addTextStamp() {
    const asset = createTextStamp(stampText, stampColor, stampPt)
    if (!asset) return
    addAsset(asset)
    setStampText("")
  }

  function addDateStamp() {
    const format = DATE_FORMATS.find((f) => f.id === dateFormat) ?? DATE_FORMATS[0]
    const asset = createTextStamp(format.format(new Date()), stampColor, stampPt)
    if (asset) addAsset(asset)
  }

  async function handleSign() {
    if (!file || items.length === 0) return
    setBusy(true)
    setError(null)
    clearResult()

    try {
      const filename = safeFilename(outName, "signed")
      const { blob, signedPages } = await signPdf(file, items, assets)
      const url = URL.createObjectURL(blob)
      urlRef.current = url
      setResult({ url, filename, size: blob.size, pages: signedPages })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 p-6">
      {!file ? (
        <FileDropzone
          accept={PDF_FILES}
          onFiles={pick}
          onError={setError}
          buttonLabel="Choose PDF"
        />
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-foreground" title={file.name}>
              {file.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {fmt(file.size)}
              {numPages > 0 && ` · ${numPages} ${numPages === 1 ? "page" : "pages"}`}
            </p>
          </div>
          <button
            onClick={removeFile}
            disabled={busy}
            aria-label={`Remove ${file.name}`}
            className="rounded-lg px-3 py-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-50"
          >
            ✕
          </button>
        </div>
      )}

      {file && !pdf && !error && <p className="text-center text-muted-foreground">Opening PDF…</p>}

      {tooMany && (
        <p role="alert" className="text-center text-red-600">
          This PDF has {numPages} pages, and the signing tool supports up to {MAX_SIGN_PAGES}. Split
          it first with Split PDF.
        </p>
      )}

      {file && pdf && !tooMany && (
        <>
          {/* 1. Signature */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">1. Create your signature</h2>

            {assets.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Click one to add it to the current page.
                </p>
                <ul className="flex flex-wrap gap-3">
                  {assets.map((a) => (
                    <li key={a.id} className="relative">
                      <button
                        type="button"
                        onClick={() => place(a)}
                        title={`Add "${a.label}" to page ${pageIndex + 1}`}
                        className="grid h-20 min-w-[7rem] max-w-[12rem] place-items-center rounded-xl border border-border bg-white p-2 transition hover:border-primary/60"
                      >
                        <img src={a.dataUrl} alt={a.label} className="max-h-16 w-auto max-w-full" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${a.label}`}
                        onClick={() => removeAsset(a.id)}
                        className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {assets.length > 0 && (
              <button type="button" onClick={() => setShowCreator((s) => !s)} className={secondaryButton}>
                {showCreator ? "Hide the creator" : "Create another signature"}
              </button>
            )}

            {(showCreator || assets.length === 0) && <SignatureCreator onCreate={addAsset} />}

            {/* Text and date */}
            <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
              <p className="text-sm font-semibold text-foreground">Add text or today&apos;s date</p>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={stampText}
                  maxLength={80}
                  onChange={(e) => setStampText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addTextStamp()
                  }}
                  placeholder="Name, place, job title…"
                  aria-label="Text to add"
                  className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={addTextStamp}
                  disabled={!stampText.trim()}
                  className={secondaryButton}
                >
                  Add text
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  aria-label="Date format"
                  className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                >
                  {DATE_FORMATS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={addDateStamp} className={secondaryButton}>
                  Add today&apos;s date
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <select
                  value={stampPt}
                  onChange={(e) => setStampPt(Number(e.target.value))}
                  aria-label="Text size"
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                >
                  {STAMP_SIZES.map((s) => (
                    <option key={s.pt} value={s.pt}>
                      {s.label} text
                    </option>
                  ))}
                </select>
                <InkPicker value={stampColor} onChange={setStampColor} />
              </div>
            </div>
          </section>

          {/* 2. Place */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">2. Place it on the page</h2>
            <p className="text-sm text-muted-foreground">
              Drag an item to move it and drag the round corner handle to resize. You can also use
              the arrow keys to nudge it, or the buttons below.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => goToPage(pageIndex - 1)}
                disabled={pageIndex === 0}
                aria-label="Previous page"
                className={secondaryButton}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <span className="min-w-[8rem] text-center text-sm font-semibold text-foreground">
                Page {pageIndex + 1} of {numPages}
                {pageItems.length > 0 && (
                  <span className="font-normal text-muted-foreground"> · {pageItems.length} placed</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => goToPage(pageIndex + 1)}
                disabled={pageIndex >= numPages - 1}
                aria-label="Next page"
                className={secondaryButton}
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <PageStage
              pdf={pdf}
              pageIndex={pageIndex}
              onBackgroundPointerDown={() => setSelectedId(null)}
            >
              {pageItems.map((item) => {
                const asset = assetMap.get(item.assetId)
                if (!asset) return null
                return (
                  <PlacedSignature
                    key={item.id}
                    item={item}
                    asset={asset}
                    selected={item.id === selectedId}
                    onSelect={setSelectedId}
                    onChange={(id, patch) => updateItem(id, () => patch)}
                    onRemove={removeItem}
                  />
                )
              })}
            </PageStage>

            {selected && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button type="button" onClick={() => resize(selected.id, 0.9)} className={secondaryButton}>
                  <Minus className="h-4 w-4" aria-hidden /> Smaller
                </button>
                <button type="button" onClick={() => resize(selected.id, 1.1)} className={secondaryButton}>
                  <Plus className="h-4 w-4" aria-hidden /> Larger
                </button>
                {numPages > 1 && (
                  <button type="button" onClick={() => copyToAllPages(selected.id)} className={secondaryButton}>
                    <Copy className="h-4 w-4" aria-hidden /> Add to all pages
                  </button>
                )}
                <button type="button" onClick={() => removeItem(selected.id)} className={secondaryButton}>
                  <Trash2 className="h-4 w-4" aria-hidden /> Remove
                </button>
              </div>
            )}
          </section>

          {/* 3. Download */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">3. Download</h2>

            <div className="space-y-2">
              <label htmlFor="sign-name" className="block text-sm font-semibold text-foreground">
                Output file name
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="sign-name"
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
              label={
                items.length > 0
                  ? `Sign PDF (${items.length} ${items.length === 1 ? "item" : "items"} on ${pagesWithItems} ${pagesWithItems === 1 ? "page" : "pages"})`
                  : "Sign PDF"
              }
              busyLabel="Signing…"
              busy={busy}
              disabled={items.length === 0}
              onClick={handleSign}
            >
              {items.length === 0 && !busy && (
                <p className="text-center text-sm text-muted-foreground">
                  Add a signature, text or date to a page first.
                </p>
              )}
            </ActionButton>
          </section>
        </>
      )}

      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}

      {result && (
        <div className="space-y-3">
          <ResultCard
            action={{ type: "link", href: result.url, filename: result.filename, label: "Download PDF" }}
          >
            Signed <span className="font-bold">{result.pages}</span>{" "}
            {result.pages === 1 ? "page" : "pages"}{" "}
            <span className="text-muted-foreground">({fmt(result.size)})</span>
          </ResultCard>
          <p className="text-center text-sm text-muted-foreground">
            This adds a visible signature to the PDF. It is not a certified digital signature, so
            check whether your recipient requires one.
          </p>
        </div>
      )}
    </div>
  )
}