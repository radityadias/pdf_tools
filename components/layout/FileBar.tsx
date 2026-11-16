"use client"

import { FileText } from "lucide-react"
import type { ProtectionState } from "@/hooks/useProtection"
import { formatBytes } from "@/lib/format"

const BADGES: Partial<Record<ProtectionState, { text: string; className: string }>> = {
  checking: { text: "Checking…", className: "bg-secondary text-muted-foreground" },
  none: { text: "Not protected", className: "bg-secondary text-foreground" },
  open: { text: "Has restrictions", className: "bg-accent text-accent-foreground" },
  "needs-password": { text: "Password required", className: "bg-accent text-accent-foreground" },
}

export default function FileBar({
  file,
  state,
  onRemove,
  disabled = false,
}: {
  file: File
  state: ProtectionState | null
  onRemove: () => void
  disabled?: boolean
}) {
  const badge = state ? BADGES[state] : undefined

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
        <FileText className="h-6 w-6" aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-foreground" title={file.name}>
          {file.name}
        </p>
        <p className="text-sm text-muted-foreground">{formatBytes(file.size)}</p>
      </div>

      {badge && (
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
          {badge.text}
        </span>
      )}

      <button
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Remove ${file.name}`}
        className="rounded-lg px-3 py-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-50"
      >
        ✕
      </button>
    </div>
  )
}