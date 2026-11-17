import { CalendarDays } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'

import { useClubClock } from '../../app/club-clock'
import { useClub } from '../../app/club-context'
import { dateLabel } from '../../shared/format'
import { Button } from '../../shared/ui'
import { createAvailability } from '../club/domain/availability'
import { addDays, dateKey, hoursFor } from '../club/domain/rules'
import { DateToolbar } from './calendar/date-toolbar'

export function BookingDatePicker({
  date,
  onChange,
  excludeId,
}: {
  date: string
  onChange: (date: string) => void
  excludeId?: string
}) {
  const { view } = useClub()
  const now = useClubClock()
  const dayRail = useRef<HTMLDivElement>(null)
  const selectedDay = useRef<HTMLButtonElement>(null)
  const today = dateKey(now)
  const weekStart = addDays(date, -((new Date(`${date}T12:00:00`).getDay() + 6) % 7))
  const settings = view!.settings
  const reservations = view!.reservations
  const courtsFor = useMemo(
    () => createAvailability({ settings, reservations }, now, excludeId),
    [settings, reservations, now, excludeId],
  )
  const { days, selectedCount, nextDay } = useMemo(() => {
    const countFor = (day: string) =>
      hoursFor(settings, day).reduce((sum, hour) => sum + courtsFor(day, hour).length, 0)
    const selectedCount = countFor(date)
    const days = Array.from({ length: 7 }, (_, index) => {
      const day = addDays(weekStart, index)
      return { day, count: countFor(day), closed: hoursFor(settings, day).length === 0 }
    })
    // Finding another day is unnecessary while the selected day still has availability.
    let nextDay: string | undefined
    if (selectedCount === 0) {
      for (let offset = 1; offset <= 60; offset++) {
        const day = addDays(date, offset)
        if (countFor(day) > 0) {
          nextDay = day
          break
        }
      }
    }
    return { days, selectedCount, nextDay }
  }, [settings, courtsFor, date, weekStart])
  useEffect(() => {
    const rail = dayRail.current
    const selected = selectedDay.current
    if (rail && selected) {
      // Scroll only the date strip, never the page or its sticky controls.
      rail.scrollLeft = selected.offsetLeft - (rail.clientWidth - selected.offsetWidth) / 2
    }
  }, [date])
  return (
    <div>
      <DateToolbar date={date} today={today} min={today} onChange={onChange} className="pb-2" />
      <div
        ref={dayRail}
        className="desktop:gap-1.5 relative grid auto-cols-[minmax(44px,1fr)] grid-flow-col gap-1 overflow-x-auto overscroll-x-contain p-1"
        aria-label="Elige un día"
      >
        {days.map(({ day, count, closed }) => {
          return (
            <Button
              variant="ghost"
              key={day}
              ref={day === date ? selectedDay : undefined}
              className="group border-line enabled:hover:border-green-mid disabled:bg-canvas disabled:text-muted aria-pressed:border-green aria-pressed:bg-green grid min-h-20 min-w-11 content-center justify-items-center gap-1 rounded-[10px] border px-0.5 py-2 disabled:opacity-60 aria-pressed:text-white"
              aria-label={`${dateLabel(day)}, ${day < today ? 'pasado' : closed ? 'cerrado' : `${count} huecos libres`}`}
              aria-pressed={date === day}
              disabled={count === 0}
              onClick={() => onChange(day)}
            >
              <span className="group-disabled:text-muted text-[11px] group-aria-pressed:text-[#e4eecb]">
                {day === today ? 'Hoy' : dateLabel(day, { weekday: 'short' })}
              </span>
              <strong className="text-xl leading-tight">{Number(day.slice(-2))}</strong>
              <span
                aria-hidden="true"
                className="size-1 rounded-full bg-current opacity-60 group-disabled:invisible"
              />
            </Button>
          )
        })}
      </div>
      {selectedCount === 0 && (
        <div className="text-muted grid justify-items-center gap-2 pt-3 text-center text-[13px]">
          <CalendarDays size={26} />
          <strong>No quedan horas disponibles este día.</strong>
          <p>Elige otra fecha para tu próxima partida.</p>
          {nextDay && (
            <Button variant="secondary" onClick={() => onChange(nextDay)}>
              Próximo día disponible · {dateLabel(nextDay, { day: 'numeric', month: 'short' })}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
