import { RankingChart } from '../../shared/ui/ranking-chart'
import { leaders, type CountItem } from './domain/reservation-report'

function Highlight({ title, items, total }: { title: string; items: CountItem[]; total: number }) {
  const top = leaders(items)
  const names = top?.labels.slice(0, 3).join(', ')
  const more = top && top.labels.length > 3 ? ` y ${top.labels.length - 3} más` : ''
  return (
    <div className="border-line rounded-xl border bg-white p-4">
      <p className="text-muted text-xs">{title}</p>
      <p className="mt-2 text-sm font-semibold">{top ? `${names}${more}` : 'Sin datos'}</p>
      <p className="text-muted mt-1 text-xs">
        {top
          ? `${top.labels.length > 1 ? 'Empate · ' : ''}${top.value} reservas${top.labels.length > 1 ? ' por opción' : ''} · ${Math.round((top.value / total) * 100)}% del total`
          : 'No hay reservas confirmadas'}
      </p>
    </div>
  )
}

export function ActivityCharts({
  report,
}: {
  report: {
    total: number
    courts: CountItem[]
    days: CountItem[]
    hours: CountItem[]
    slots: CountItem[]
    people: CountItem[]
  }
}) {
  return (
    <>
      <h2 className="mb-3 text-base font-semibold">Claves del periodo</h2>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Highlight title="Día con más reservas" items={report.days} total={report.total} />
        <Highlight title="Hora con más reservas" items={report.hours} total={report.total} />
        <Highlight title="Día y hora más reservados" items={report.slots} total={report.total} />
        <Highlight title="Pista con más reservas" items={report.courts} total={report.total} />
      </div>
      <p className="text-muted mb-3 text-xs leading-relaxed">
        Los colores y las barras comparan cada valor con el mayor de su gráfico: verde oscuro ≥75%,
        verde claro ≥40% y ámbar por debajo. No representan ocupación ni rentabilidad.
      </p>
      <div className="grid items-start gap-3 lg:grid-cols-2">
        <RankingChart
          title="Reservas por día"
          description="Número de reservas confirmadas por día de la semana."
          items={report.days}
          relativeColors
        />
        <RankingChart
          title="Reservas por hora"
          description="Hora de inicio. Incluye el horario actual y franjas con reservas históricas."
          items={report.hours}
          relativeColors
          columns={2}
        />
        <RankingChart
          title="Reservas por pista"
          description="Número de reservas confirmadas en cada pista."
          items={report.courts}
          relativeColors
        />
        <RankingChart
          title="Socios con más reservas"
          description="Hasta 6 socios según los filtros seleccionados."
          items={report.people.slice(0, 6)}
          relativeColors
        />
      </div>
    </>
  )
}
