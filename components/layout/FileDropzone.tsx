"use client"

import { useId, useState, type DragEvent } from "react"
import { acceptAttribute, filterFiles, type AcceptRule } from "@/lib/files"

type Props = {
  accept: AcceptRule
  /** Called with valid files only. Single-file mode passes an array of one. */
  onFiles: (files: File[]) => void
  /** Called on every selection: a message when something was rejected, null otherwise */
  onError?: (message: string | null) => void
  multiple?: boolean
  disabled?: boolean
  /** Most files accepted in one selection, e.g. MAX_FILES - items.length */
  maxFiles?: number
  maxSizeMB?: number
  buttonLabel?: string
  hint?: string
  className?: string
}

// OS file drags carry the "Files" type. Dragging an element inside the page does not,
// so lists with drag-to-reorder never trigger the dropzone by accident.
const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer.types).includes("Files")

export default function FileDropzone({
  accept,
  onFiles,
  onError,
  multiple = false,
  disabled = false,
  maxFiles,
  maxSizeMB,
  buttonLabel,
  hint,
  className = "",
}: Props) {
  const id = useId()
  const [dragging, setDragging] = useState(false)

  function handle(list: FileList | null) {
    if (disabled || !list || list.length === 0) return
    const { accepted, message } = filterFiles(Array.from(list), {
      accept,
      multiple,
      maxFiles,
      maxSizeMB,
    })
    onError?.(message)
    if (accepted.length > 0) onFiles(accepted)
  }

  const label = buttonLabel ?? (multiple ? `Choose ${accept.noun}s` : `Choose ${accept.noun}`)
  const hintText =
    hint ?? (multiple ? `or drop ${accept.noun} files here` : `or drop your ${accept.noun} file here`)

  return (
    <div className={className}>
      {/* sr-only (not hidden) keeps the input focusable for keyboard users */}
      <input
        id={id}
        type="file"
        accept={acceptAttribute(accept)}
        multiple={multiple}
        disabled={disabled}
        className="peer sr-only"
        onChange={(e) => {
          handle(e.target.files)
          e.target.value = "" // lets the user pick the same file again
        }}
      />

      <label
        htmlFor={id}
        onDragOver={(e) => {
          if (!hasFiles(e)) return
          e.preventDefault() // also stops the browser from opening the dropped file
          if (!disabled) setDragging(true)
        }}
        onDragLeave={(e) => {
          // ignore leave events that just move between child elements
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false)
        }}
        onDrop={(e) => {
          if (!hasFiles(e)) return
          e.preventDefault()
          setDragging(false)
          handle(e.dataTransfer.files)
        }}
        className={`flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition
                    peer-focus-visible:ring-4 peer-focus-visible:ring-primary/30 ${
                      disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                    } ${
                      dragging
                        ? "border-primary bg-secondary"
                        : `border-border bg-card ${disabled ? "" : "hover:border-primary/60"}`
                    }`}
      >
        <span className="rounded-xl bg-primary px-8 py-4 text-xl font-bold text-primary-foreground">
          {label}
        </span>
        <span className="text-sm text-muted-foreground">{hintText}</span>
      </label>
    </div>
  )
}