import { ArrowUpRight, Clock3 } from 'lucide-react'

import { cn } from '../../shared/cn'
import { dateLabel, hourLabel } from '../../shared/format'
import { Badge, Button } from '../../shared/ui'
import type { Reservation } from '../club/domain/model'

export function ReservationCard({
  reservation,
  history,
  onClick,
}: {
  reservation: Reservation
  history: boolean
  onClick: () => void
}) {
  const cancelled = reservation.status === 'cancelled'
  return (
    <Button
      variant="ghost"
      className={cn(
        'border-line enabled:hover:border-green-mid enabled:hover:bg-accent-soft relative grid h-auto w-full min-w-0 items-start justify-stretch justify-items-stretch gap-2 overflow-hidden rounded-xl border p-3 text-left',
        history ? 'bg-canvas' : 'bg-white',
        cancelled && 'border-dashed',
      )}
      onClick={onClick}
    >
      <span
        aria-hidden="true"
        className="text-green pointer-events-none absolute right-3 bottom-0 text-6xl leading-none font-bold opacity-[0.06]"
      >
        {reservation.court}
      </span>
      <div className="relative flex items-center gap-2">
        <h3 className="mr-auto min-w-0 text-sm">Pista {reservation.court}</h3>
        <Badge tone={cancelled || history ? 'gray' : 'green'} className="shrink-0">
          {cancelled ? 'Cancelada' : history ? 'Jugada' : 'Confirmada'}
        </Badge>
        <ArrowUpRight size={17} className="text-muted shrink-0" aria-hidden="true" />
      </div>
      <div className="relative flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] leading-5">
        <span>
          {dateLabel(reservation.date, { weekday: 'short', day: 'numeric', month: 'long' })}
        </span>
        <span className="flex items-center gap-1 font-semibold tabular-nums">
          <Clock3 size={14} aria-hidden="true" />
          {hourLabel(reservation.hour)} – {hourLabel(reservation.hour + 1)}
        </span>
      </div>
    </Button>
  )
}
