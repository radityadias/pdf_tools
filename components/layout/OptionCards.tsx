"use client"

export default function OptionCards<T extends string | number>({
  legend,
  name,
  options,
  value,
  onChange,
  disabled = false,
  hint,
}: {
  legend: string
  name: string
  options: { value: T; title: string; desc: string }[]
  value: T
  onChange: (v: T) => void
  disabled?: boolean
  hint?: string
}) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-foreground">{legend}</legend>
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
      {hint && <p className="mt-2 text-sm text-muted-foreground">{hint}</p>}
    </fieldset>
  )
}