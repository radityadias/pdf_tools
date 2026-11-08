/* eslint-disable @next/next/no-img-element */
"use client";

import FileCard from "../layout/FileCard";
import FileDropzone from "../layout/FileDropzone";
import ActionButton from "../layout/ActionButton";
import ResultCard from "../layout/ResultCard";

import { PDF_FILES } from "@/lib/files";
import { formatBytes as fmt } from "@/lib/format";
import { usePdfDocument } from "@/hooks/usePdfDocument";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MAX_PAGES_PER_RUN,
  renderPdfPages,
  zipImages,
  type ImageFormat,
  type RenderedPage,
} from "@/services/pdf-to-image";
import { parseRanges } from "@/services/split";
import { MAX_THUMBS } from "@/services/thumbnails";

type Mode = "all" | "range" | "select";

const MODES: { value: Mode; title: string; desc: string }[] = [
  { value: "all", title: "All pages", desc: "Convert the whole document" },
  { value: "range", title: "By range", desc: "Type pages like 1-3, 5, 8-" },
  { value: "select", title: "Select pages", desc: "Click the pages you want" },
];

const FORMATS: { value: ImageFormat; title: string; desc: string }[] = [
  { value: "jpeg", title: "JPG", desc: "Small files, works everywhere" },
  { value: "png", title: "PNG", desc: "Lossless, sharpest text" },
  { value: "webp", title: "WebP", desc: "Smallest, modern browsers" },
];

const RESOLUTIONS: { value: number; title: string; desc: string }[] = [
  { value: 72, title: "72 DPI", desc: "Screen, smallest files" },
  { value: 150, title: "150 DPI", desc: "Good for most uses" },
  { value: 300, title: "300 DPI", desc: "Print quality" },
];

function saveUrl(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

type Result = { page: RenderedPage; url: string };

function OptionCards<T extends string | number>({
  legend,
  name,
  options,
  value,
  onChange,
  disabled,
}: {
  legend: string;
  name: string;
  options: { value: T; title: string; desc: string }[];
  value: T;
  onChange: (v: T) => void;
  disabled: boolean;
}) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-foreground">
        {legend}
      </legend>
      <div className="grid gap-3 sm:grid-cols-3">
        {options.map((o) => (
          <label key={String(o.value)} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={String(o.value)}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              disabled={disabled}
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
  );
}

export default function PdfToImage() {
  const [file, setFile] = useState<File | null>(null);

  const [mode, setMode] = useState<Mode>("all");
  const [rangeInput, setRangeInput] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const [format, setFormat] = useState<ImageFormat>("jpeg");
  const [dpi, setDpi] = useState(150);
  const [quality, setQuality] = useState(90); // percent, jpeg and webp only

  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [limited, setLimited] = useState(false);

  const urlsRef = useRef<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  // Revoke object URLs and stop any running conversion when leaving the page
  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
      // eslint-disable-next-line react-hooks/exhaustive-deps
      abortRef.current?.abort();
    };
  }, []);

  const { totalPages, thumbs } = usePdfDocument(file, {
    onError: (message) => {
      resetDocument();
      setError(message);
      setFile(null);
    },
  });

  function clearResults() {
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current.length = 0;
    setResults([]);
    setLimited(false);
  }

  function resetDocument() {
    clearResults();
    setSelected(new Set());
  }

  function pick(files: File[] | null) {
    if (!files) return;
    setError(null);
    resetDocument();
    setFile(files[0]);
  }

  function removeFile() {
    abortRef.current?.abort();
    resetDocument();
    setFile(null);
  }

  function toggle(i: number) {
    clearResults();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function selectAll() {
    clearResults();
    setSelected(new Set(Array.from({ length: totalPages }, (_, i) => i)));
  }

  function invertSelection() {
    clearResults();
    setSelected(
      new Set(
        Array.from({ length: totalPages }, (_, i) => i).filter(
          (i) => !selected.has(i),
        ),
      ),
    );
  }

  // Which pages will be converted, computed live from the current inputs
  const plan = useMemo<{ pages: number[] | null; error: string | null }>(() => {
    if (!file || totalPages === 0) return { pages: null, error: null };

    try {
      let pages: number[];

      if (mode === "all") {
        pages = Array.from({ length: totalPages }, (_, i) => i);
      } else if (mode === "range") {
        if (!rangeInput.trim()) return { pages: null, error: null };
        pages = [...new Set(parseRanges(rangeInput, totalPages).flat())].sort(
          (a, b) => a - b,
        );
      } else {
        if (selected.size === 0) return { pages: null, error: null };
        pages = [...selected].sort((a, b) => a - b);
      }

      if (pages.length > MAX_PAGES_PER_RUN) {
        throw new Error(
          `That's ${pages.length} pages. Convert at most ${MAX_PAGES_PER_RUN} at a time. Use "By range" to pick a smaller part.`,
        );
      }
      return { pages, error: null };
    } catch (e) {
      return {
        pages: null,
        error: e instanceof Error ? e.message : "Invalid input",
      };
    }
  }, [file, totalPages, mode, rangeInput, selected]);

  async function handleConvert() {
    if (!file || !plan.pages) return;

    setBusy(true);
    setError(null);
    setProgress(0);
    clearResults();

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await renderPdfPages(file, {
        pages: plan.pages,
        format,
        dpi,
        quality: quality / 100,
        signal: controller.signal,
        onProgress: (done, total) =>
          setProgress(Math.round((done / total) * 100)),
        onPage: (page) => {
          const url = URL.createObjectURL(page.blob);
          urlsRef.current.push(url);
          setResults((prev) => [...prev, { page, url }]);
          if (page.limited) setLimited(true);
        },
      });
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setError("Conversion cancelled.");
      } else {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  async function handleZip() {
    if (!file || results.length === 0) return;
    setZipping(true);
    try {
      const blob = await zipImages(results.map((r) => r.page));
      const url = URL.createObjectURL(blob);
      saveUrl(url, `${file.name.replace(/\.pdf$/i, "")}_images.zip`);
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      setError("Could not create the ZIP file.");
    } finally {
      setZipping(false);
    }
  }

  const totalSize = results.reduce((sum, r) => sum + r.page.blob.size, 0);
  const showQuality = format !== "png";

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
        <FileCard
          file={file}
          thumbnail={thumbs[0]}
          pages={totalPages || undefined}
          onRemove={removeFile}
        />
      )}

      {file && totalPages > 0 && (
        <>
          {/* Page selection */}
          <OptionCards
            legend="Pages to convert"
            name="img-mode"
            options={MODES}
            value={mode}
            onChange={(m) => {
              clearResults();
              setMode(m);
            }}
            disabled={busy}
          />

          {mode === "range" && (
            <div className="space-y-3">
              <label
                htmlFor="img-ranges"
                className="block text-sm font-semibold text-foreground"
              >
                Pages
              </label>
              <input
                id="img-ranges"
                type="text"
                value={rangeInput}
                onChange={(e) => {
                  clearResults();
                  setRangeInput(e.target.value);
                }}
                placeholder="e.g. 1-3, 5, 8-"
                disabled={busy}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
              />
              <p className="text-sm text-muted-foreground">
                Separate with commas. <code>8-</code> means page 8 to the end.
                This PDF has {totalPages} pages.
              </p>
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
                  {
                    label: "Clear",
                    onClick: () => {
                      clearResults();
                      setSelected(new Set());
                    },
                  },
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
                  const on = selected.has(i);
                  const loading = i < MAX_THUMBS && !thumbs[i];
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
                        <img
                          src={thumbs[i]}
                          alt=""
                          className="h-auto w-full rounded border border-border"
                        />
                      ) : (
                        <div
                          className={`aspect-[3/4] w-full rounded bg-secondary ${
                            loading ? "animate-pulse" : ""
                          }`}
                        />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {i + 1}
                      </span>
                      {on && (
                        <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-xs text-primary-foreground">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {totalPages > MAX_THUMBS && (
                <p className="text-sm text-muted-foreground">
                  Previews are shown for the first {MAX_THUMBS} pages. Later
                  pages can still be selected by number in &quot;By range&quot;
                  mode.
                </p>
              )}
            </div>
          )}

          {/* Output settings */}
          <OptionCards
            legend="Image format"
            name="img-format"
            options={FORMATS}
            value={format}
            onChange={(f) => {
              clearResults();
              setFormat(f);
            }}
            disabled={busy}
          />

          <OptionCards
            legend="Resolution"
            name="img-dpi"
            options={RESOLUTIONS}
            value={dpi}
            onChange={(d) => {
              clearResults();
              setDpi(d);
            }}
            disabled={busy}
          />

          {showQuality && (
            <div className="space-y-2">
              <label
                htmlFor="img-quality"
                className="flex justify-between text-sm font-semibold text-foreground"
              >
                <span>Quality</span>
                <span className="text-muted-foreground">{quality}%</span>
              </label>
              <input
                id="img-quality"
                type="range"
                min={50}
                max={100}
                step={5}
                value={quality}
                onChange={(e) => {
                  clearResults();
                  setQuality(Number(e.target.value));
                }}
                disabled={busy}
                className="w-full accent-primary"
              />
              <p className="text-sm text-muted-foreground">
                Lower quality means a smaller file. 80-90% is a good balance.
              </p>
            </div>
          )}

          {plan.error && <p className="text-red-600">{plan.error}</p>}

          {/* Action */}
          <ActionButton
            label="Convert to images"
            busyLabel="Converting…"
            busy={busy}
            progress={progress}
            disabled={!plan.pages}
            onClick={handleConvert}
            onCancel={() => abortRef.current?.abort()}
          >
            {plan.pages && !busy && (
              <p className="text-center text-sm text-muted-foreground">
                This will create {plan.pages.length}{" "}
                {plan.pages.length === 1 ? "image" : "images"}.
              </p>
            )}
          </ActionButton>
        </>
      )}

      {error && <p className="text-red-600">{error}</p>}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <ResultCard
            layout="inline"
            action={
              busy
                ? undefined
                : results.length === 1
                  ? {
                      type: "link",
                      href: results[0].url,
                      filename: results[0].page.name,
                      label: "Download image",
                    }
                  : {
                      type: "button",
                      onClick: handleZip,
                      label: "Download all (ZIP)",
                      busy: zipping,
                      busyLabel: "Preparing ZIP…",
                    }
            }
          >
            <span className="font-bold">{results.length}</span>{" "}
            {results.length === 1 ? "image" : "images"}{" "}
            <span className="text-muted-foreground">({fmt(totalSize)})</span>
          </ResultCard>

          {limited && (
            <p className="text-sm text-muted-foreground">
              Some pages are very large, so they were rendered at a lower
              resolution than you chose to stay within browser limits.
            </p>
          )}

          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {results.map(({ page, url }) => (
              <li
                key={page.pageNumber}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                <img
                  src={url}
                  alt={`Page ${page.pageNumber}`}
                  className="h-48 w-full bg-secondary object-contain"
                />
                <div className="space-y-2 p-3">
                  <p className="text-sm font-semibold text-foreground">
                    Page {page.pageNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {page.width}×{page.height} · {fmt(page.blob.size)}
                  </p>
                  <a
                    href={url}
                    download={page.name}
                    className="block rounded-lg bg-accent px-3 py-2 text-center text-sm font-bold text-accent-foreground transition hover:brightness-95"
                  >
                    Download
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
