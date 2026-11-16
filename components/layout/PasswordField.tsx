"use client"

import { Eye, EyeOff } from "lucide-react"
import { passwordStrength } from "@/lib/password"

const BAR_COLORS = ["bg-secondary", "bg-red-500", "bg-accent", "bg-green-600"]

export default function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggleVisible,
  autoComplete,
  disabled = false,
  hint,
  error,
  showStrength = false,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  visible: boolean
  onToggleVisible: () => void
  autoComplete: "new-password" | "current-password"
  disabled?: boolean
  hint?: string
  error?: string | null
  showStrength?: boolean
}) {
  const strength = showStrength ? passwordStrength(value) : null

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-foreground">
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          disabled={disabled}
          aria-invalid={!!error}
          className="w-full rounded-xl border border-border bg-card py-3 pl-4 pr-12 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={onToggleVisible}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </button>
      </div>

      {strength && value && (
        <div className="flex items-center gap-3">
          <div className="flex flex-1 gap-1" aria-hidden>
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={`h-1.5 flex-1 rounded-full ${
                  strength.score >= n ? BAR_COLORS[strength.score] : "bg-secondary"
                }`}
              />
            ))}
          </div>
          <span className="w-16 text-right text-xs text-muted-foreground">{strength.label}</span>
        </div>
      )}

      {hint && !error && <p className="text-sm text-muted-foreground">{hint}</p>}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}