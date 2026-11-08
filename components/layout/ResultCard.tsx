"use client"

import type { ReactNode } from "react"

export type ResultAction =
  | { type: "link"; href: string; filename: string; label: string }
  | {
      type: "button"
      onClick: () => void
      label: string
      busy?: boolean
      busyLabel?: string
    }

type Props = {
  /** The summary text, e.g. "Created 3 PDFs (1.2 MB)" */
  children: ReactNode
  /** Leave undefined to show the summary without an action (e.g. while still busy) */
  action?: ResultAction
  /** "stacked": centered card. "inline": summary on the left, action on the right. */
  layout?: "stacked" | "inline"
  className?: string
}

const ACTION_CLASS =
  "rounded-xl bg-accent px-6 py-3 font-bold text-accent-foreground transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"

export default function ResultCard({
  children,
  action,
  layout = "stacked",
  className = "",
}: Props) {
  const actionEl =
    action &&
    (action.type === "link" ? (
      <a
        href={action.href}
        download={action.filename}
        className={`inline-block ${ACTION_CLASS}`}
      >
        {action.label}
      </a>
    ) : (
      <button
        type="button"
        onClick={action.onClick}
        disabled={action.busy}
        className={ACTION_CLASS}
      >
        {action.busy ? (action.busyLabel ?? "Working…") : action.label}
      </button>
    ))

  if (layout === "inline") {
    return (
      <div
        role="status"
        className={`flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 ${className}`}
      >
        <p className="mr-auto text-foreground">{children}</p>
        {actionEl}
      </div>
    )
  }

  return (
    <div
      role="status"
      className={`space-y-4 rounded-xl border border-border bg-card p-5 text-center ${className}`}
    >
      <p className="text-foreground">{children}</p>
      {actionEl}
    </div>
  )
}