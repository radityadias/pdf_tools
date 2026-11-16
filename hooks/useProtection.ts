"use client"

import { useEffect, useState } from "react"
import { inspectPdf, type Protection } from "@/services/qpdf"

export type ProtectionState = "checking" | Protection | "failed"

/** Checks whether the file is password-protected. Returns null while no file is chosen. */
export function useProtection(file: File | null): ProtectionState | null {
  const [result, setResult] = useState<{ file: File; state: Protection | "failed" } | null>(null)

  useEffect(() => {
    if (!file) return

    let cancelled = false
    inspectPdf(file)
      .then((state) => {
        if (!cancelled) setResult({ file, state })
      })
      .catch(() => {
        if (!cancelled) setResult({ file, state: "failed" })
      })

    return () => {
      cancelled = true
    }
  }, [file])

  if (!file) return null
  // A result belongs to its own file, so a new file never shows the old file's state
  return result && result.file === file ? result.state : "checking"
}