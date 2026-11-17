import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '../../../shared/cn'
import { dateLabel } from '../../../shared/format'
import { Button, IconButton } from '../../../shared/ui'
import { addDays } from '../../club/domain/rules'

export function DateToolbar({
  date,
  today,
  min,
  showToday = false,
  showWeekRange = false,
  className,
  onChange,
}: {
  date: string
  today: string
  min?: string
  showToday?: boolean
  showWeekRange?: boolean
  className?: string
  onChange: (date: string) => void
}) {
  const weekStart = addDays(date, -((new Date(`${date}T12:00:00`).getDay() + 6) % 7))
  const period = showWeekRange
    ? new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).formatRange(
        new Date(`${weekStart}T12:00:00`),
        new Date(`${addDays(weekStart, 6)}T12:00:00`),
      )
    : dateLabel(date, { month: 'long', year: 'numeric' })
  function change(value: string) {
    if (value && (!min || value >= min)) onChange(value)
  }
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-2', className)}>
      <div className="desktop:flex-none flex min-w-0 flex-1 items-center justify-between gap-0.5">
        <IconButton
          label="Semana anterior"
          variant={showWeekRange ? 'outline' : 'ghost'}
          disabled={!!min && weekStart <= min}
          onClick={() => change(min && addDays(date, -7) < min ? min : addDays(date, -7))}
        >
          <ChevronLeft size={18} />
        </IconButton>
        <strong className="min-w-0 px-2 text-center text-xs" aria-live="polite" aria-atomic="true">
          {period}
        </strong>
        <IconButton
          label="Semana siguiente"
          variant={showWeekRange ? 'outline' : 'ghost'}
          onClick={() => change(addDays(date, 7))}
        >
          <ChevronRight size={18} />
        </IconButton>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {showToday && (
          <Button
            variant="secondary"
            className="desktop:text-xs px-3 py-2 text-xs"
            onClick={() => change(today)}
          >
            Hoy
          </Button>
        )}
        <label className="bg-canvas focus-within:outline-green-mid desktop:size-9 relative grid size-11 cursor-pointer place-items-center rounded-lg focus-within:outline-3 focus-within:outline-offset-2">
          <CalendarDays size={17} />
          <input
            className="absolute inset-0 size-full min-h-0 cursor-pointer opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:size-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            aria-label="Ir a una fecha"
            type="date"
            min={min}
            value={date}
            onChange={(event) => change(event.target.value)}
          />
        </label>
      </div>
    </div>
  )
}
