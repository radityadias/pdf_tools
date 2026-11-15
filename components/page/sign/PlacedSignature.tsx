/* eslint-disable @next/next/no-img-element */
"use client"

import { useRef } from "react"
import type { PlacedItem, SignatureAsset } from "@/services/sign"

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

type Drag = {
  mode: "move" | "resize"
  startX: number
  startY: number
  x: number
  y: number
  w: number
  rect: DOMRect
}

export default function PlacedSignature({
  item,
  asset,
  selected,
  onSelect,
  onChange,
  onRemove,
}: {
  item: PlacedItem
  asset: SignatureAsset
  selected: boolean
  onSelect: (id: string) => void
  onChange: (id: string, patch: Partial<PlacedItem>) => void
  onRemove: (id: string) => void
}) {
  const drag = useRef<Drag | null>(null)

  // Height as a fraction of the page height, for a given width fraction
  const heightFrac = (w: number, rect: DOMRect) => (w * rect.width) / asset.aspect / rect.height

  function begin(e: React.PointerEvent<HTMLElement>, mode: Drag["mode"]) {
    e.stopPropagation() // so the page background doesn't deselect
    onSelect(item.id)
    const stage = e.currentTarget.closest<HTMLElement>("[data-stage]")
    if (!stage) return
    drag.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      x: item.x,
      y: item.y,
      w: item.w,
      rect: stage.getBoundingClientRect(),
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function move(e: React.PointerEvent) {
    const d = drag.current
    if (!d) return
    const dx = (e.clientX - d.startX) / d.rect.width
    const dy = (e.clientY - d.startY) / d.rect.height

    if (d.mode === "move") {
      const h = heightFrac(d.w, d.rect)
      onChange(item.id, {
        x: clamp(d.x + dx, 0, 1 - d.w),
        y: clamp(d.y + dy, 0, Math.max(0, 1 - h)),
      })
    } else {
      // Keep the aspect ratio, anchored at the top-left corner
      const maxW = Math.min(1 - d.x, ((1 - d.y) * d.rect.height * asset.aspect) / d.rect.width)
      onChange(item.id, { w: clamp(d.w + dx, 0.04, Math.max(0.04, maxW)) })
    }
  }

  function end() {
    drag.current = null // pointer capture is released automatically
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault()
      onRemove(item.id)
      return
    }
    const step = e.shiftKey ? 0.02 : 0.005
    const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0
    const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0
    if (!dx && !dy) return
    e.preventDefault()

    const stage = e.currentTarget.closest<HTMLElement>("[data-stage]")
    if (!stage) return
    const h = heightFrac(item.w, stage.getBoundingClientRect())
    onChange(item.id, {
      x: clamp(item.x + dx, 0, 1 - item.w),
      y: clamp(item.y + dy, 0, Math.max(0, 1 - h)),
    })
  }

  return (
    <div
      tabIndex={0}
      role="group"
      aria-label={`${asset.label}, page ${item.page + 1}. Arrow keys move it, Delete removes it.`}
      onPointerDown={(e) => begin(e, "move")}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onFocus={() => onSelect(item.id)}
      onKeyDown={onKeyDown}
      className={`absolute cursor-move touch-none select-none outline-none ${
        selected ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-primary/60"
      }`}
      style={{ left: `${item.x * 100}%`, top: `${item.y * 100}%`, width: `${item.w * 100}%` }}
    >
      <img
        src={asset.dataUrl}
        alt=""
        draggable={false}
        className="pointer-events-none block h-auto w-full"
      />

      {selected && (
        <>
          <button
            type="button"
            aria-label="Remove"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onRemove(item.id)}
            className="absolute -right-3 -top-3 grid h-6 w-6 place-items-center rounded-full bg-red-600 text-xs font-bold text-white shadow"
          >
            ✕
          </button>
          {/* The move, up and end handlers on the parent also receive this handle's events */}
          <span
            aria-hidden
            onPointerDown={(e) => begin(e, "resize")}
            className="absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize rounded-full border-2 border-white bg-primary shadow"
          />
        </>
      )}
    </div>
  )
}