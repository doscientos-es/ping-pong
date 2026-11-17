import { Plus, Trash2 } from 'lucide-react'

import { hourLabel } from '../../shared/format'
import { Button, IconButton } from '../../shared/ui'
import { WEEKDAYS, type OpeningDay } from '../club/domain/model'

export function OpeningDayEditor({
  value,
  onChange,
}: {
  value: OpeningDay
  onChange: (value: OpeningDay) => void
}) {
  const { day, intervals } = value
  const open = intervals.length > 0
  function updateInterval(index: number, field: 'start' | 'end', hour: number) {
    onChange({
      ...value,
      intervals: intervals.map((interval, i) =>
        i === index ? { ...interval, [field]: hour } : interval,
      ),
    })
  }
  return (
    <div className="border-line desktop:flex-row flex flex-col items-start gap-3 border-t py-4">
      <div className="desktop:grid desktop:w-auto desktop:min-w-[125px] flex w-full items-center justify-between gap-1.5 pt-2">
        <label className="relative flex cursor-pointer items-center gap-2 text-sm">
          <input
            className="peer absolute m-0 size-8 opacity-0"
            type="checkbox"
            checked={open}
            aria-label={`Abrir ${WEEKDAYS[day]}`}
            onChange={(event) =>
              onChange({ ...value, intervals: event.target.checked ? [{ start: 8, end: 22 }] : [] })
            }
          />
          <span
            aria-hidden="true"
            className="h-[19px] w-[31px] rounded-full bg-[#e2e7d9] p-[3px] peer-checked:bg-[#668b4d] peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-[#8da866] before:block before:size-[13px] before:rounded-full before:bg-white before:content-[''] peer-checked:before:translate-x-3"
          />
          <strong>{WEEKDAYS[day]}</strong>
        </label>
        <span className="text-muted desktop:ml-10 text-xs">
          {open
            ? `${intervals.reduce((sum, interval) => sum + Math.max(0, interval.end - interval.start), 0)} turnos / pista`
            : 'Cerrado'}
        </span>
      </div>
      <div className="grid w-full flex-1 justify-items-start gap-2">
        {intervals.map((interval, index) => (
          <div key={index} className="flex w-full items-center gap-2">
            {(['start', 'end'] as const).map((field) => (
              <span key={field} className="contents">
                {field === 'end' && <span className="text-muted text-xs">—</span>}
                <select
                  className="desktop:min-h-9 desktop:flex-none desktop:text-sm min-w-[78px] flex-1 p-2"
                  aria-label={`${field === 'start' ? 'Apertura' : 'Cierre'} ${WEEKDAYS[day]} franja ${index + 1}`}
                  value={interval[field]}
                  onChange={(event) => updateInterval(index, field, Number(event.target.value))}
                >
                  {Array.from({ length: 24 }, (_, hour) => hour + (field === 'end' ? 1 : 0)).map(
                    (hour) => (
                      <option key={hour} value={hour}>
                        {hourLabel(hour)}
                      </option>
                    ),
                  )}
                </select>
              </span>
            ))}
            <IconButton
              className="text-muted ml-auto"
              label={`Eliminar franja ${index + 1} de ${WEEKDAYS[day]}`}
              onClick={() =>
                onChange({ ...value, intervals: intervals.filter((_, i) => i !== index) })
              }
            >
              <Trash2 size={16} />
            </IconButton>
          </div>
        ))}
        {open && (
          <Button
            variant="ghost"
            className="text-green-mid desktop:py-1 inline-flex items-center gap-1 px-0 py-3 text-[13px]"
            disabled={intervals.at(-1)!.end >= 24}
            onClick={() =>
              onChange({
                ...value,
                intervals: [...intervals, { start: Math.min(23, intervals.at(-1)!.end), end: 24 }],
              })
            }
          >
            <Plus size={15} />
            Añadir franja
          </Button>
        )}
      </div>
    </div>
  )
}
