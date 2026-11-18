import type { ReportPeriod } from '../report-period'

const monthOptions = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
].map((label, index) => ({ label, value: String(index + 1).padStart(2, '0') }))

const quarterOptions = [
  { label: '1.º · ene–mar', value: '01' },
  { label: '2.º · abr–jun', value: '04' },
  { label: '3.º · jul–sep', value: '07' },
  { label: '4.º · oct–dic', value: '10' },
]

export function PeriodFields({
  label,
  value,
  currentYear,
  period = 'month',
  allowAllPeriods = false,
  onChange,
}: {
  label: string
  /** YYYY-MM, or YYYY / empty when broader periods are allowed. */
  value: string
  currentYear: number
  period?: ReportPeriod
  allowAllPeriods?: boolean
  onChange: (value: string) => void
}) {
  const [year, month = ''] = value.split('-')
  const latestYear = Math.min(9999, Math.max(currentYear + 5, Number(year)))
  const years = Array.from({ length: latestYear - 1900 + 1 }, (_, index) => latestYear - index)
  const quarter = period === 'quarter'
  const options = quarter ? quarterOptions : monthOptions
  const selected = quarter
    ? (quarterOptions[Math.floor((Number(month) - 1) / 3)]?.value ?? '')
    : month

  return (
    <fieldset aria-label={label} className="m-0 flex min-w-0 flex-wrap gap-2 border-0 p-0">
      <label className="text-muted grid gap-1 text-xs">
        Año
        <select
          value={year}
          onChange={(event) =>
            onChange(event.target.value ? event.target.value + value.slice(4) : '')
          }
        >
          {allowAllPeriods && <option value="">Todos los años</option>}
          {years.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      {period !== 'year' && (
        <label className="text-muted grid gap-1 text-xs">
          {quarter ? 'Trimestre' : 'Mes'}
          <select
            value={selected}
            onChange={(event) =>
              onChange(event.target.value ? `${year || currentYear}-${event.target.value}` : year)
            }
          >
            {allowAllPeriods && <option value="">Todos los meses</option>}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )}
    </fieldset>
  )
}
