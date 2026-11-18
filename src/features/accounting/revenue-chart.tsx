import { dateLabel, money } from '../../shared/format'
import { dateKey } from '../club/domain/rules'
import { monthRange, summarize } from './domain/finance'
import type { FinancialRow } from './domain/model'

export function RevenueChart({
  rows,
  from,
  to,
}: {
  rows: FinancialRow[]
  from: string
  to: string
}) {
  const ranges: { from: string; to: string; label: string }[] = []
  const limit = new Date(`${to}T12:00:00`)
  if (from.slice(0, 7) === to.slice(0, 7)) {
    const cursor = new Date(`${from}T12:00:00`)
    while (cursor.getTime() <= limit.getTime()) {
      const start = dateKey(cursor)
      const end = new Date(cursor)
      end.setDate(end.getDate() + 6)
      const last = end.getTime() > limit.getTime() ? to : dateKey(end)
      ranges.push({
        from: start,
        to: last,
        label: `${Number(start.slice(-2))}–${Number(last.slice(-2))}`,
      })
      cursor.setDate(cursor.getDate() + 7)
    }
  } else {
    const cursor = new Date(`${from}T12:00:00`)
    while (cursor.getTime() <= limit.getTime()) {
      const range = monthRange(dateKey(cursor).slice(0, 7))
      ranges.push({ ...range, label: dateLabel(range.from, { month: 'short' }).replace('.', '') })
      cursor.setMonth(cursor.getMonth() + 1)
    }
  }
  const points = ranges.map((range) => ({ ...range, ...summarize(rows, range.from, range.to) }))
  const maximum = Math.max(1, ...points.flatMap((point) => [point.income, point.expenses]))
  return (
    <figure className="p-4">
      <figcaption>
        <h3 className="text-sm font-semibold">Ingresos y gastos por fecha de documento</h3>
      </figcaption>
      {points.every((point) => point.income === 0 && point.expenses === 0) && (
        <p className="text-muted mt-4 text-xs">No hay ingresos ni gastos en este periodo.</p>
      )}
      <div
        aria-hidden="true"
        className="border-line mt-5 grid auto-cols-fr grid-flow-col gap-1 border-b"
      >
        {points.map((point) => (
          <div key={point.from} className="min-w-0">
            <div
              className="flex h-36 items-end justify-center gap-1"
              title={`${point.label}: ingresos ${money(point.income)}, gastos ${money(point.expenses)}`}
            >
              <div
                className="bg-green-mid w-4 max-w-[40%] rounded-t"
                style={{ height: `${(point.income / maximum) * 100}%` }}
              />
              <div
                className="w-4 max-w-[40%] rounded-t bg-amber-500/70"
                style={{ height: `${(point.expenses / maximum) * 100}%` }}
              />
            </div>
            <span className="text-muted my-2 block truncate text-center text-[11px] capitalize">
              {point.label}
            </span>
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="text-muted mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <span>
          <span className="bg-green-mid mr-1.5 inline-block size-2 rounded-full" />
          Ingresos netos
        </span>
        <span>
          <span className="mr-1.5 inline-block size-2 rounded-full bg-amber-500/70" />
          Gastos contables
        </span>
      </div>
      <details className="text-muted mt-3 text-xs">
        <summary className="cursor-pointer">Ver desglose del periodo</summary>
        <table className="mt-2 w-full text-left">
          <caption>Importes por intervalo del periodo</caption>
          <thead>
            <tr>
              <th>Intervalo</th>
              <th>Ingresos netos</th>
              <th>Gastos contables</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.from}>
                <th>
                  {point.from} a {point.to}
                </th>
                <td>{money(point.income)}</td>
                <td>{money(point.expenses)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}
