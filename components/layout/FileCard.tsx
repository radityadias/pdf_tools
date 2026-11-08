/* eslint-disable @next/next/no-img-element */
"use client"

import { formatBytes } from "@/lib/format"

type Props = {
  file: File
  /** Preview image (data URL or object URL). A skeleton shows while it's undefined. */
  thumbnail?: string
  previewAlt?: string
  pages?: number
  /** Replaces the default "size · pages" line, e.g. "1920×1080" for an image */
  details?: string
  onRemove?: () => void
  disabled?: boolean
  className?: string
}

export default function FileCard({
  file,
  thumbnail,
  previewAlt = "First page preview",
  pages,
  details,
  onRemove,
  disabled = false,
  className = "",
}: Props) {
  const meta =
    details ??
    [formatBytes(file.size), pages ? `${pages} ${pages === 1 ? "page" : "pages"}` : null]
      .filter(Boolean)
      .join(" · ")

  return (
    <div
      className={`flex items-center gap-4 rounded-xl border border-border bg-card p-4 ${className}`}
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={previewAlt}
          className="h-24 w-auto shrink-0 rounded border border-border shadow-sm"
        />
      ) : (
        <div className="h-24 w-[68px] shrink-0 animate-pulse rounded bg-secondary" />
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-foreground" title={file.name}>
          {file.name}
        </p>
        <p className="text-sm text-muted-foreground">{meta}</p>
      </div>

      {onRemove && (
        <button
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Remove ${file.name}`}
          className="rounded-lg px-3 py-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-50"
        >
          ✕
        </button>
      )}
    </div>
  )
}