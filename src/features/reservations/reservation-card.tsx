import { ArrowUpRight, CalendarDays, Clock3 } from 'lucide-react'

import { cn } from '../../shared/cn'
import { dateLabel, hourLabel } from '../../shared/format'
import { Badge, Button } from '../../shared/ui'
import type { Reservation } from '../club/domain/model'
import { reservationStateClasses } from './reservation-styles'

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
  const upcoming = !cancelled && !history
  return (
    <Button
      variant="ghost"
      className={cn(
        'grid h-auto w-full min-w-0 items-start justify-stretch justify-items-stretch gap-3 rounded-xl border p-3 text-left',
        upcoming ? reservationStateClasses.occupied : reservationStateClasses.inactive,
        upcoming
          ? 'enabled:hover:bg-green-mid enabled:hover:text-white'
          : 'enabled:hover:border-green-mid enabled:hover:bg-accent-soft enabled:hover:text-green',
        cancelled && 'border-dashed',
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <h3 className="mr-auto min-w-0 text-sm">Pista {reservation.court}</h3>
        <Badge className={cn('shrink-0', upcoming ? 'bg-lime text-green' : 'text-muted bg-white')}>
          {cancelled ? 'Cancelada' : history ? 'Jugada' : 'Confirmada'}
        </Badge>
        <ArrowUpRight size={17} className={cn('shrink-0', upcoming ? 'text-lime' : 'text-muted')} />
      </div>
      <div className="grid gap-1.5">
        <p className="flex items-start gap-2 text-[13px] leading-5">
          <CalendarDays size={16} className="mt-0.5 shrink-0" />
          <span>
            {dateLabel(reservation.date, { weekday: 'short', day: 'numeric', month: 'long' })}
          </span>
        </p>
        <p className="flex items-center gap-2 text-sm font-semibold tabular-nums">
          <Clock3 size={16} className="shrink-0" />
          <span>
            {hourLabel(reservation.hour)} – {hourLabel(reservation.hour + 1)}
          </span>
        </p>
      </div>
    </Button>
  )
}
