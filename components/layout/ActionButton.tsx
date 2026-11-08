"use client"

import type { ReactNode } from "react"

type Props = {
  /** Idle label, e.g. "Compress PDF". Pass a different string while loading inputs. */
  label: string
  /** Shown while busy; the percentage is appended when `progress` is given */
  busyLabel?: string
  busy?: boolean
  /** 0-100. The bar and the percentage only show while busy. */
  progress?: number
  /** Extra disabled condition. The button is always disabled while busy. */
  disabled?: boolean
  onClick: () => void
  /** When provided, a Cancel button appears while busy */
  onCancel?: () => void
  cancelLabel?: string
  /** Helper text or notes under the button. The tool decides when to render them. */
  children?: ReactNode
  className?: string
}

export default function ActionButton({
  label,
  busyLabel = "Working…",
  busy = false,
  progress,
  disabled = false,
  onClick,
  onCancel,
  cancelLabel = "Cancel",
  children,
  className = "",
}: Props) {
  const showProgress = busy && progress !== undefined

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClick}
          disabled={disabled || busy}
          aria-busy={busy}
          className="flex-1 rounded-xl bg-primary px-6 py-4 text-lg font-bold text-primary-foreground shadow-sm transition
                     hover:bg-primary-hover active:scale-[0.99]
                     focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30
                     disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? (showProgress ? `${busyLabel} ${progress}%` : busyLabel) : label}
        </button>

        {busy && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-border bg-card px-6 py-4 font-semibold text-foreground transition hover:bg-secondary"
          >
            {cancelLabel}
          </button>
        )}
      </div>

      {showProgress && (
        <div
          role="progressbar"
          aria-label={busyLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          className="h-1.5 w-full overflow-hidden rounded-full bg-secondary"
        >
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {children}
    </div>
  )
}