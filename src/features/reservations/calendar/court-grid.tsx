import { Check, Plus } from 'lucide-react'
import { useMemo } from 'react'

import { cn } from '../../../shared/cn'
import { dateLabel, hourLabel } from '../../../shared/format'
import { Button } from '../../../shared/ui/button'
import { COURTS, type BookingInput, type Member, type Reservation } from '../../club/domain/model'
import { dateKey, startTime } from '../../club/domain/rules'
import { reservationStateClasses } from '../reservation-styles'

export function CourtGrid({
  date,
  hours,
  opening,
  daily,
  half,
  now,
  members,
  onBook,
  onDetail,
}: {
  date: string
  hours: number[]
  opening: number[]
  daily: Reservation[]
  half: number
  now: Date
  members: Member[]
  onBook: (slot: BookingInput) => void
  onDetail: (reservation: Reservation) => void
}) {
  const reservationsBySlot = useMemo(
    () => new Map(daily.map((item) => [`${item.hour}|${item.court}`, item])),
    [daily],
  )
  const membersById = useMemo(() => new Map(members.map((item) => [item.id, item])), [members])
  const openingHours = new Set(opening)
  const currentHour = date === dateKey(now) ? now.getHours() : null
  const visibility = (court: number) => ((court <= 4 ? 0 : 1) !== half ? 'max-desktop:hidden' : '')
  return (
    <div className="desktop:px-4 overflow-x-auto px-2 pb-2">
      <table className="desktop:min-w-[640px] w-full table-fixed border-separate border-spacing-x-1 border-spacing-y-[5px]">
        <caption className="sr-only">Disponibilidad del {dateLabel(date)}. Ocho pistas.</caption>
        <thead>
          <tr>
            <th scope="col" className="text-muted w-11 pb-3 text-left text-xs font-normal">
              Hora
            </th>
            {COURTS.map((court) => (
              <th
                key={court}
                scope="col"
                className={cn('text-muted pb-3 text-xs font-medium', visibility(court))}
              >
                <span className="text-green-mid mb-1.5 block text-xl leading-none">▱</span>Pista{' '}
                {court}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hours.map((hour) => (
            <tr key={hour} className={hour === currentHour ? 'relative' : undefined}>
              <th scope="row" className="text-muted text-left text-xs font-normal">
                {hourLabel(hour)}
                {hour === currentHour && (
                  <span
                    aria-hidden="true"
                    data-testid="current-time-indicator"
                    className="pointer-events-none absolute inset-x-0 -bottom-[3px] z-10 h-px rounded-full bg-red-500/70"
                  />
                )}
              </th>
              {COURTS.map((court) => {
                const reservation = reservationsBySlot.get(`${hour}|${court}`)
                const past = startTime(date, hour) <= now.getTime()
                const closed = !openingHours.has(hour)
                const member = reservation ? membersById.get(reservation.memberId) : undefined
                return (
                  <td key={court} className={cn('p-0', visibility(court))}>
                    <Button
                      variant="ghost"
                      className={cn(
                        'flex h-11 w-full items-center justify-center gap-1 rounded-md border px-0.5 py-0 text-xs whitespace-nowrap disabled:opacity-100',
                        reservation
                          ? cn(
                              reservationStateClasses.occupied,
                              'enabled:hover:bg-green-mid enabled:hover:text-white',
                            )
                          : past || closed
                            ? reservationStateClasses.inactive
                            : cn(
                                reservationStateClasses.available,
                                'enabled:hover:bg-accent-soft enabled:hover:text-green border-dashed',
                              ),
                      )}
                      disabled={!reservation && (past || closed)}
                      aria-label={`Pista ${court}, ${hourLabel(hour)}: ${reservation ? `reserva de ${member?.name ?? 'socio'}` : past ? 'franja pasada' : closed ? 'cerrado' : 'disponible'}`}
                      onClick={() =>
                        reservation ? onDetail(reservation) : onBook({ court, date, hour })
                      }
                    >
                      {reservation ? (
                        <>
                          <Check size={13} />
                          <span className="truncate">{member?.name.split(' ')[0]}</span>
                        </>
                      ) : past || closed ? (
                        '—'
                      ) : (
                        <>
                          <Plus size={13} />
                          <span>Libre</span>
                        </>
                      )}
                    </Button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
