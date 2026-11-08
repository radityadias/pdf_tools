"use client"

import FileDropzone from "../layout/FileDropzone"
import FileCard from "../layout/FileCard"
import ActionButton from "../layout/ActionButton"
import ResultCard from "../layout/ResultCard"

import { usePdfDocument } from "@/hooks/usePdfDocument"
import { PDF_FILES } from "@/lib/files"
import { formatBytes as fmt } from "@/lib/format"
import { useState } from "react"
import { compressPdf, type Preset } from "@/services/compress"

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

  const { totalPages, thumbs } = usePdfDocument(file, {
    limit: 1, 
    onError: (message) => {
      setError(message)
      setFile(null)
    },
  })

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

  function pick(files: File[]) {
    if (result) URL.revokeObjectURL(result.url)
    setResult(null)
    setFile(files[0])
  }

  function removeFile() {
    if (result) URL.revokeObjectURL(result.url)
    setResult(null)
    setFile(null)
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      <div className="space-y-4">
        <FileDropzone 
          accept={PDF_FILES}
          onFiles={pick}
          onError={setError}
          disabled={busy}
          buttonLabel={file ? "Choose another PDF": "Choose PDF"}
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

      <ActionButton 
        label="Compress PDF"
        busyLabel="Compressing..."
        busy={busy}
        progress={progress}
        disabled={!file}
        onClick={handleCompress}
      />

      {error && <p className="text-red-600">{error}</p>}

      {result && (
        <ResultCard
          action={{
            type: "link",
            href: result.url,
            filename: `compressed-${file?.name ?? "file.pdf"}`,
            label: "Download",
          }}
        >
          {fmt(result.before)} → <span className="font-bold">{fmt(result.after)}</span>{" "}
          <span className="text-muted-foreground">
            ({Math.round((1 - result.after / result.before) * 100)}% smaller)
          </span>
        </ResultCard>
      )}
    </div>
  );
}