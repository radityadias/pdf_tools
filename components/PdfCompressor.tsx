"use client"

import { useState, useEffect } from "react"
import { compressPdf, type Preset } from "@/services/compress"
import { renderFirstPage } from "@/services/preview" 

const fmt = (n: number) => n > 1_048_576 ? `${(n / 1_048_576).toFixed(2)} MB` : `${(n / 1024).toFixed(0)} KB`

const PRESET_OPTIONS: { value: Preset; title: string; desc: string }[] = [
  { value: "light", title: "Light", desc: "Best quality, bigger file" },
  { value: "balanced", title: "Balanced", desc: "Recommended" },
  { value: "strong", title: "Strong", desc: "Smallest file, lower quality" },
]

export default function PdfCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [preset, setPreset] = useState<Preset>("balanced");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; before: number; after: number } | null>(null);
  const [preview, setPreview] = useState<{ thumb: string; pages: number } | null >(null);
  const [dragging, setDragging] = useState(false);

  async function handleCompress() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setProgress(0);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);

    try {
      const { blob, before, after } = await compressPdf(file, preset, (done, total) =>
        setProgress(Math.round((done / total) * 100))
      );
      setResult({ url: URL.createObjectURL(blob), before, after });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    setPreview(null);
    if (!file) return;

    let cancelled = false;
    renderFirstPage(file)
      .then((p) => { if (!cancelled) setPreview(p); })
      .catch(() => {}); // e.g. password-protected PDF: we just skip the thumbnail

    return () => { cancelled = true; };
  }, [file]);

  function pick(f: File | null) {
    if (!f) return;
    if (f.type !== "application/pdf") {
      setError("Please choose a PDF file.");
      return;
    }
    setError(null);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setFile(f);
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <div className="space-y-4">
        <input
          id="file-upload"
          type="file"
          accept="application/pdf"
          hidden
          onChange={(e) => {
            pick(e.target.files?.[0] ?? null);
            e.target.value = ""; // lets the user re-pick the same file
          }}
        />

        <label
          htmlFor="file-upload"
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pick(e.dataTransfer.files?.[0] ?? null);
          }}
          className={`flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition ${
            dragging ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary/60"
          }`}
        >
          <span className="rounded-xl bg-primary px-8 py-4 text-xl font-bold text-primary-foreground">
            {file ? "Choose another PDF" : "Choose PDF"}
          </span>
          <span className="text-sm text-muted-foreground">or drop a PDF here</span>
        </label>

        {file && (
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.thumb}
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
                {preview && ` · ${preview.pages} ${preview.pages === 1 ? "page" : "pages"}`}
              </p>
            </div>

            <button
              onClick={() => setFile(null)}
              disabled={busy}
              aria-label="Remove file"
              className="rounded-lg px-3 py-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-50"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-foreground">
          Compression level
        </legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {PRESET_OPTIONS.map((o) => (
            <label key={o.value} className="cursor-pointer">
              <input
                type="radio"
                name="preset"
                value={o.value}
                checked={preset === o.value}
                onChange={() => setPreset(o.value)}
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
                <p className="font-semibold text-foreground">{o.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{o.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <button
          onClick={handleCompress}
          disabled={!file || busy}
          className="w-full rounded-xl bg-primary px-6 py-4 text-lg font-bold text-primary-foreground shadow-sm transition
                     hover:bg-primary-hover active:scale-[0.99]
                     focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30
                     disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? `Compressing… ${progress}%` : "Compress PDF"}
        </button>

        {busy && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {result && (
        <div className="space-y-4 rounded-xl border border-border bg-card p-5 text-center">
          <p className="text-foreground">
            {fmt(result.before)} → <span className="font-bold">{fmt(result.after)}</span>{" "}
            <span className="text-muted-foreground">
              ({Math.round((1 - result.after / result.before) * 100)}% smaller)
            </span>
          </p>
          <a
            href={result.url}
            download={`compressed-${file?.name ?? "file.pdf"}`}
            className="inline-block rounded-xl bg-accent px-6 py-3 font-bold text-accent-foreground transition hover:brightness-95"
          >
            Download
          </a>
        </div>
      )}
    </div>
  );
}