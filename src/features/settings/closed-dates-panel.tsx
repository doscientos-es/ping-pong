import { CalendarOff, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { dateLabel } from '../../shared/format'
import { Button, IconButton, InlineError, Panel, SectionHeading } from '../../shared/ui'

export function ClosedDatesPanel({
  dates,
  onChange,
}: {
  dates: string[]
  onChange: (dates: string[]) => void
}) {
  const [date, setDate] = useState('')
  const [error, setError] = useState('')
  function add() {
    if (dates.includes(date)) {
      setError('Esta fecha ya está marcada como cierre.')
      return
    }
    setError('')
    onChange([...dates, date].sort())
    setDate('')
  }
  return (
    <Panel className="pb-5">
      <SectionHeading
        title={
          <>
            <CalendarOff size={20} />
            Días de cierre
          </>
        }
      />
      <div className="desktop:px-6 grid gap-4 px-4">
        <InlineError>{error}</InlineError>
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[190px] flex-1">
            Fecha de cierre
            <input
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value)
                setError('')
              }}
            />
          </label>
          <Button variant="secondary" disabled={!date} onClick={add}>
            <Plus size={17} />
            Añadir cierre
          </Button>
        </div>
        {dates.length ? (
          <div className="divide-line divide-y">
            {dates.map((value) => (
              <div key={value} className="text-muted flex items-center gap-2 py-2 text-[13px]">
                <CalendarOff size={17} />
                <span>
                  {dateLabel(value, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
                <IconButton
                  className="ml-auto"
                  label={`Eliminar cierre ${value}`}
                  onClick={() => onChange(dates.filter((date) => date !== value))}
                >
                  <Trash2 size={17} />
                </IconButton>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted text-[13px]">
            Sin cierres excepcionales. Se aplicará el horario semanal.
          </p>
        )}
      </div>
    </Panel>
  )
}
