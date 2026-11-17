import { useId } from 'react'

import { invalidDateRange, type DateRange } from '../date-range'

export function DateRangeFields({
  label,
  value,
  onChange,
}: {
  label: string
  value: DateRange
  onChange: (value: DateRange) => void
}) {
  const errorId = useId()
  const invalid = invalidDateRange(value)
  return (
    <fieldset className="m-0 w-full min-w-0 flex-1 border-0 p-0">
      <legend className="text-muted mb-1 text-xs font-semibold">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        <label className="grid min-w-0 gap-1 text-xs">
          Desde
          <input
            aria-label={`${label}: desde`}
            type="date"
            className="min-h-11 w-full min-w-0"
            value={value.from}
            max={value.to || undefined}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? errorId : undefined}
            onChange={(event) => onChange({ ...value, from: event.target.value })}
          />
        </label>
        <label className="grid min-w-0 gap-1 text-xs">
          Hasta
          <input
            aria-label={`${label}: hasta`}
            type="date"
            className="min-h-11 w-full min-w-0"
            value={value.to}
            min={value.from || undefined}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? errorId : undefined}
            onChange={(event) => onChange({ ...value, to: event.target.value })}
          />
        </label>
      </div>
      {invalid && (
        <p id={errorId} role="alert" className="mt-1 text-xs">
          La fecha inicial no puede ser posterior a la final.
        </p>
      )}
    </fieldset>
  )
}
