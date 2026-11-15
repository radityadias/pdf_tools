/* eslint-disable @next/next/no-img-element */
"use client"

import { useDeferredValue, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react"
import FileDropzone from "@/components/layout/FileDropzone"
import { IMAGE_FILES } from "@/lib/files"
import { SIGNATURE_FONTS } from "@/lib/signature-fonts"
import type { SignatureAsset } from "@/services/sign"
import {
  assetFromBitmap,
  createDrawnAsset,
  createTypedAsset,
  drawStroke,
  INK_COLORS,
  loadUploadBitmap,
  PAD_HEIGHT,
  PAD_WIDTH,
  PEN_WIDTH,
  type Stroke,
} from "@/services/signature-assets"

type Tab = "draw" | "type" | "upload"

const TABS: { value: Tab; label: string }[] = [
  { value: "draw", label: "Draw" },
  { value: "type", label: "Type" },
  { value: "upload", label: "Upload" },
]

export function InkPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (color: string) => void
}) {
  return (
    <div role="radiogroup" aria-label="Ink colour" className="flex items-center gap-2">
      {INK_COLORS.map((c) => (
        <button
          key={c.value}
          type="button"
          role="radio"
          aria-checked={value === c.value}
          aria-label={c.label}
          title={c.label}
          onClick={() => onChange(c.value)}
          style={{ backgroundColor: c.value }}
          className={`h-8 w-8 rounded-full border-2 transition ${
            value === c.value ? "border-primary ring-2 ring-primary/30" : "border-border"
          }`}
        />
      ))}
    </div>
  )
}

function DrawPad({
  strokesRef,
  version,
  color,
  onChange,
}: {
  strokesRef: MutableRefObject<Stroke[]>
  version: number
  color: string
  onChange: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)

  function redraw() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const s of strokesRef.current) drawStroke(ctx, s, color, PEN_WIDTH)
  }

  // Redraw when the colour changes or a stroke is undone or cleared
  useEffect(() => {
    redraw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color, version])

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    return {
      x: ((e.clientX - r.left) / r.width) * PAD_WIDTH,
      y: ((e.clientY - r.top) / r.height) * PAD_HEIGHT,
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-white">
      <div aria-hidden className="pointer-events-none absolute inset-x-6 bottom-[28%] border-t border-dashed border-border" />
      <p aria-hidden className="pointer-events-none absolute left-6 top-3 text-xs text-muted-foreground">
        Sign here with your mouse, finger or stylus
      </p>
      <canvas
        ref={canvasRef}
        width={PAD_WIDTH}
        height={PAD_HEIGHT}
        aria-label="Signature drawing area"
        className="relative block h-auto w-full cursor-crosshair touch-none"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          drawing.current = true
          strokesRef.current.push([point(e)])
          redraw()
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return
          strokesRef.current[strokesRef.current.length - 1]?.push(point(e))
          redraw()
        }}
        onPointerUp={() => {
          if (!drawing.current) return
          drawing.current = false
          onChange()
        }}
        onPointerCancel={() => {
          drawing.current = false
          onChange()
        }}
      />
    </div>
  )
}

export default function SignatureCreator({
  onCreate,
}: {
  onCreate: (asset: SignatureAsset) => void
}) {
  const [tab, setTab] = useState<Tab>("draw")
  const [color, setColor] = useState(INK_COLORS[0].value)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Draw
  const strokesRef = useRef<Stroke[]>([])
  const [version, setVersion] = useState(0)
  const [inkCount, setInkCount] = useState(0)

  // Type
  const [typed, setTyped] = useState("")
  const [fontId, setFontId] = useState(SIGNATURE_FONTS[0].id)
  const font = SIGNATURE_FONTS.find((f) => f.id === fontId) ?? SIGNATURE_FONTS[0]

  // Upload
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null)
  const [clean, setClean] = useState(true)
  const [threshold, setThreshold] = useState(190)
  const deferredThreshold = useDeferredValue(threshold)

  // Free the decoded image when it is replaced or the creator closes
  useEffect(() => () => bitmap?.close(), [bitmap])

  const preview = useMemo(
    () => (bitmap ? assetFromBitmap(bitmap, { clean, threshold: deferredThreshold, color }) : null),
    [bitmap, clean, deferredThreshold, color]
  )

  function bumpDrawing() {
    setInkCount(strokesRef.current.length)
    setVersion((v) => v + 1)
  }

  async function handleUpload(files: File[]) {
    setError(null)
    try {
      setBitmap(await loadUploadBitmap(files[0]))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read this image.")
    }
  }

  const canUse =
    tab === "draw" ? inkCount > 0 : tab === "type" ? typed.trim().length > 0 : !!preview

  async function useSignature() {
    setError(null)
    setBusy(true)
    try {
      let asset: SignatureAsset | null = null
      if (tab === "draw") asset = createDrawnAsset(strokesRef.current, color)
      else if (tab === "type") asset = await createTypedAsset(typed, font.family, color)
      else asset = preview

      if (!asset) {
        setError(tab === "upload" ? "Choose an image first." : "Add your signature first.")
        return
      }
      onCreate(asset)

      // Reset for the next one
      strokesRef.current = []
      setInkCount(0)
      setVersion((v) => v + 1)
      setTyped("")
      setBitmap(null)
    } catch {
      setError("Could not create the signature. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <div
        role="tablist"
        aria-label="Signature type"
        className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-background p-1"
      >
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => {
              setError(null)
              setTab(t.value)
            }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === t.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "draw" && (
        <div className="space-y-3">
          <DrawPad strokesRef={strokesRef} version={version} color={color} onChange={bumpDrawing} />
          <div className="flex flex-wrap items-center gap-3">
            <InkPicker value={color} onChange={setColor} />
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                disabled={inkCount === 0}
                onClick={() => {
                  strokesRef.current.pop()
                  bumpDrawing()
                }}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground transition hover:bg-secondary disabled:opacity-50"
              >
                Undo
              </button>
              <button
                type="button"
                disabled={inkCount === 0}
                onClick={() => {
                  strokesRef.current = []
                  bumpDrawing()
                }}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground transition hover:bg-secondary disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "type" && (
        <div className="space-y-3">
          <label htmlFor="typed-signature" className="block text-sm font-semibold text-foreground">
            Your name
          </label>
          <input
            id="typed-signature"
            type="text"
            value={typed}
            maxLength={40}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Type your name"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          />

          <div role="radiogroup" aria-label="Signature style" className="grid gap-2 sm:grid-cols-3">
            {SIGNATURE_FONTS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={fontId === f.id}
                onClick={() => setFontId(f.id)}
                className={`rounded-xl border bg-white p-3 text-center transition ${
                  fontId === f.id
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <span className="block truncate text-3xl leading-tight" style={{ fontFamily: f.family, color }}>
                  {typed.trim() || "Signature"}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">{f.label}</span>
              </button>
            ))}
          </div>

          <InkPicker value={color} onChange={setColor} />
        </div>
      )}

      {tab === "upload" && (
        <div className="space-y-3">
          {!bitmap ? (
            <FileDropzone
              accept={IMAGE_FILES}
              onFiles={handleUpload}
              onError={setError}
              buttonLabel="Choose signature image"
              hint="a photo or scan of your signature on white paper"
              className="[&_label]:py-8"
            />
          ) : (
            <>
              <div
                className="grid min-h-[8rem] place-items-center rounded-xl border border-border p-3"
                style={{
                  backgroundImage:
                    "conic-gradient(#e5e7eb 25%, #fff 0 50%, #e5e7eb 0 75%, #fff 0)",
                  backgroundSize: "16px 16px",
                }}
              >
                {preview ? (
                  <img src={preview.dataUrl} alt="Signature preview" className="max-h-40 w-auto" />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nothing left after cleaning. Raise the threshold or turn cleaning off.
                  </p>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={clean}
                  onChange={(e) => setClean(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                Remove the background and recolour the ink
              </label>

              {clean && (
                <>
                  <div className="space-y-1">
                    <label htmlFor="upload-threshold" className="block text-sm font-semibold text-foreground">
                      Cleaning strength
                    </label>
                    <input
                      id="upload-threshold"
                      type="range"
                      min={100}
                      max={240}
                      value={threshold}
                      onChange={(e) => setThreshold(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <p className="text-sm text-muted-foreground">
                      Raise it if parts of the signature disappear. Lower it if grey paper remains.
                    </p>
                  </div>
                  <InkPicker value={color} onChange={setColor} />
                </>
              )}

              <button
                type="button"
                onClick={() => setBitmap(null)}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground transition hover:bg-secondary"
              >
                Choose a different image
              </button>
            </>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={useSignature}
        disabled={!canUse || busy}
        className="w-full rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Creating…" : "Use this signature"}
      </button>
    </div>
  )
}