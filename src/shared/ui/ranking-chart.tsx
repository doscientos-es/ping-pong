import { Panel } from './panel'

export function RankingChart({
  title,
  items,
  format = (value) => String(value),
  empty = 'No hay datos para este periodo.',
  relativeColors = false,
  columns = 1,
}: {
  title: string
  items: { label: string; value: number }[]
  format?: (value: number) => string
  empty?: string
  relativeColors?: boolean
  columns?: 1 | 2
}) {
  const max = Math.max(0, ...items.map((item) => item.value))
  return (
    <Panel className="p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      {max === 0 ? (
        <p className="text-muted py-8 text-center text-sm">{empty}</p>
      ) : (
        <ol className={`mt-4 grid gap-3 ${columns === 2 ? 'sm:grid-cols-2' : ''}`}>
          {items.map((item, index) => {
            const ratio = item.value / max
            const color =
              !relativeColors || ratio >= 0.75
                ? 'bg-[#35654e]'
                : ratio >= 0.4
                  ? 'bg-[#7a9a74]'
                  : 'bg-[#c59a54]'
            return (
              <li key={`${item.label}-${index}`}>
                <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                  <span className="min-w-0 truncate" title={item.label}>
                    {item.label}
                  </span>
                  <strong className="shrink-0 tabular-nums">{format(item.value)}</strong>
                </div>
                <div aria-hidden="true" className="bg-canvas h-2 overflow-hidden rounded-full">
                  <div
                    className={`${color} h-full rounded-full`}
                    style={{ width: `${ratio * 100}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </Panel>
  )
}
