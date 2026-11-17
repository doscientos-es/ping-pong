import { hourLabel } from '../../../shared/format'
import { Notice } from '../../../shared/ui'
import { startTime } from '../../club/domain/rules'
import { BookingChoice } from './booking-choice'

export function BookingHourStep({
  date,
  hour,
  hours,
  now,
  onChange,
}: {
  date: string
  hour: number | null
  hours: { hour: number; free: number }[]
  now: Date
  onChange: (hour: number) => void
}) {
  return (
    <>
      <p className="text-muted text-xs">Las horas completas o pasadas están deshabilitadas.</p>
      <div
        className="desktop:grid-cols-3 mt-3 grid grid-cols-2 gap-2 min-[390px]:grid-cols-3"
        aria-label="Horas disponibles"
      >
        {hours.map(({ hour: value, free }) => {
          const past = startTime(date, value) <= now.getTime()
          return (
            <BookingChoice
              key={value}
              disabled={!free}
              aria-pressed={hour === value}
              aria-label={`${hourLabel(value)} – ${hourLabel(value + 1)}, ${free ? `${free} pistas libres` : past ? 'hora pasada' : 'completo'}`}
              onClick={() => onChange(value)}
            >
              <strong className="text-sm">{hourLabel(value)}</strong>
              <small className="text-green-mid group-disabled:text-muted text-[11px]">
                {free
                  ? `${free} ${free === 1 ? 'pista libre' : 'pistas libres'}`
                  : past
                    ? 'Ya ha comenzado'
                    : 'Completo'}
              </small>
            </BookingChoice>
          )
        })}
      </div>
      {!hours.some((option) => option.free > 0) && (
        <Notice warning role="status" className="mt-4">
          No hay horas libres. Vuelve al paso anterior y elige otro día.
        </Notice>
      )}
    </>
  )
}
