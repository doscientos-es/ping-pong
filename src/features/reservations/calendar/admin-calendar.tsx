import { CalendarDays, Check, Plus, Settings2 } from 'lucide-react'
import { useState } from 'react'

import { useClubClock } from '../../../app/club-clock'
import { useClub } from '../../../app/club-context'
import { cn } from '../../../shared/cn'
import { dateLabel } from '../../../shared/format'
import { Button, ButtonLink, Empty, PageHeading } from '../../../shared/ui'
import type { BookingInput, Reservation } from '../../club/domain/model'
import { addDays, dateKey, hoursFor, startTime } from '../../club/domain/rules'
import { BookingDialog } from '../booking-dialog'
import { calendarSlotClasses, CourtGrid } from './court-grid'
import { DateToolbar } from './date-toolbar'

export function AdminCalendar({ onDetail }: { onDetail: (reservation: Reservation) => void }) {
  const { view } = useClub()
  const now = useClubClock()
  const today = dateKey(now)
  const [date, setDate] = useState(today)
  const [booking, setBooking] = useState<BookingInput | 'new' | null>(null)
  const daily = view!.reservations.filter(
    (item) => item.date === date && item.status === 'confirmed',
  )
  const opening = hoursFor(view!.settings, date)
  const hours = [...new Set([...opening, ...daily.map((item) => item.hour)])].sort((a, b) => a - b)
  const available = opening
    .filter((hour) => startTime(date, hour) > now.getTime())
    .reduce((total, hour) => total + 8 - daily.filter((item) => item.hour === hour).length, 0)
  const weekStart = addDays(date, -((new Date(`${date}T12:00:00`).getDay() + 6) % 7))

  return (
    <section className="min-w-0" aria-label="Calendario del club">
      <PageHeading
        title="Calendario del club"
        action={
          <div
            role="group"
            aria-label="Acciones del calendario"
            className="flex items-center gap-2"
          >
            <ButtonLink to="/configuracion" variant="secondary" className="whitespace-nowrap">
              <Settings2 size={16} />
              Editar horarios
            </ButtonLink>
            <Button className="whitespace-nowrap" onClick={() => setBooking('new')}>
              <Plus size={17} />
              Nueva reserva
            </Button>
          </div>
        }
      />
      <DateToolbar
        date={date}
        today={today}
        showToday
        showWeekRange
        onChange={setDate}
        className="pb-3"
      />
      <div
        role="group"
        aria-label="Días de la semana"
        className="border-line mb-3 grid grid-cols-7 gap-1 rounded-xl border bg-white p-1"
      >
        {Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)).map((day) => (
          <Button
            variant="ghost"
            key={day}
            aria-pressed={day === date}
            aria-label={dateLabel(day)}
            aria-current={day === today ? 'date' : undefined}
            className="group text-muted aria-pressed:bg-green grid h-auto justify-items-center gap-1 rounded-lg px-1 py-2 aria-pressed:text-white"
            onClick={() => setDate(day)}
          >
            <span className="text-xs capitalize">
              {dateLabel(day, { weekday: 'short' }).replace('.', '')}
            </span>
            <time dateTime={day} className="font-heading text-lg font-semibold">
              {Number(day.slice(-2))}
            </time>
            <span
              className={cn(
                'group-aria-pressed:bg-lime size-1 rounded-full',
                day === today && 'bg-green-mid',
              )}
            />
          </Button>
        ))}
      </div>
      <div className="border-line overflow-hidden rounded-xl border bg-white">
        {hours.length ? (
          <CourtGrid
            date={date}
            hours={hours}
            opening={opening}
            daily={daily}
            now={now}
            members={view!.members}
            onBook={setBooking}
            onDetail={onDetail}
          />
        ) : (
          <Empty icon={CalendarDays} title="Club cerrado">
            El club está cerrado en esta fecha. Elige otro día para jugar.
          </Empty>
        )}
        <div className="border-line text-muted flex flex-wrap items-center gap-4 border-t px-4 py-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={cn(
                'grid size-5 place-items-center rounded border border-dashed',
                calendarSlotClasses.available,
              )}
            >
              <Plus size={12} />
            </span>
            Disponible
          </span>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={cn(
                'grid size-5 place-items-center rounded border',
                calendarSlotClasses.occupied,
              )}
            >
              <Check size={12} />
            </span>
            Ocupada
          </span>
          <span className="ml-auto font-medium">{available} huecos libres</span>
          <span className="desktop:inline hidden">Hora local del dispositivo</span>
        </div>
        {!navigator.locks && (
          <p className="text-muted px-5 pb-4 text-xs leading-relaxed">
            Este navegador no admite bloqueo entre pestañas. Usa una sola pestaña para reservar en
            esta demo.
          </p>
        )}
      </div>
      {booking && (
        <BookingDialog
          initialDate={date}
          slot={booking === 'new' ? undefined : booking}
          onClose={() => setBooking(null)}
        />
      )}
    </section>
  )
}
