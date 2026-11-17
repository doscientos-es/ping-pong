import { money } from '../../shared/format'
import { monthRange, summarize } from './domain/finance'
import type { FinancialRow } from './domain/model'

export function RevenueChart({ rows, month }: { rows: FinancialRow[]; month: string }) {
  const [year, index] = month.split('-').map(Number)
  const points = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(year, index - 6 + i, 1, 12)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const range = monthRange(key)
    return { key, ...summarize(rows, range.from, range.to) }
  })
  const maximum = Math.max(1, ...points.flatMap((point) => [point.income, point.expenses]))
  return (
    <figure aria-label="Ingresos y gastos de los últimos seis meses" className="p-4">
      <figcaption className="mb-4 text-sm">Ingresos netos y gastos · últimos 6 meses</figcaption>
      <div className="grid grid-cols-6 gap-2" aria-hidden="true">
        {points.map((point) => (
          <div key={point.key} className="min-w-0">
            <div className="flex h-28 items-end justify-center gap-1">
              <div
                className="bg-green-mid w-4 rounded-t"
                style={{ height: `${(point.income / maximum) * 100}%` }}
              />
              <div
                className="w-4 rounded-t bg-amber-600"
                style={{ height: `${(point.expenses / maximum) * 100}%` }}
              />
            </div>
            <span className="text-muted mt-2 block text-center text-xs">{point.key.slice(5)}</span>
          </div>
        ))}
      </div>
      <p aria-hidden="true" className="text-muted mt-3 text-xs">
        Verde: ingresos · Ámbar: gastos
      </p>
      <table className="sr-only">
        <caption>Importes mensuales</caption>
        <thead>
          <tr>
            <th>Mes</th>
            <th>Ingresos</th>
            <th>Gastos</th>
            <th>Cuotas cobradas con IVA</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.key}>
              <th>{point.key}</th>
              <td>{money(point.income)}</td>
              <td>{money(point.expenses)}</td>
              <td>{money(point.subscriptions)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
